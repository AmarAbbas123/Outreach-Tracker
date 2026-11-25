import Prospect from '../models/Prospect.js';
import Link from '../models/Link.js';
import Campaign from '../models/Campaign.js';
import Client from '../models/Client.js';
import Papa from 'papaparse';

// Helper: Parse date range to a start Date
function getStartDateFromRange(range) {
  const now = new Date();
  if (range === '7d') {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (range === '30d') {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  if (range === '90d') {
    return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }
  if (range === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null; // 'all'
}

// GET /reports
export const getReportData = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId;
    const { range = '30d', client, campaign } = req.query;

    const startDate = getStartDateFromRange(range);

    // Build campaign filter
    let campaignIds = [];
    if (campaign && campaign !== 'all') {
      campaignIds = [campaign];
    } else if (client && client !== 'all') {
      const clientCampaigns = await Campaign.find({
        workspace: workspaceId,
        client: client,
      }).select('_id');
      campaignIds = clientCampaigns.map((c) => c._id);
    }

    // Base query for prospects
    const prospectMatch = { workspace: workspaceId };
    if (campaignIds.length > 0) {
      prospectMatch.campaign = { $in: campaignIds };
    }
    if (startDate) {
      prospectMatch.createdAt = { $gte: startDate };
    }

    // Base query for links
    const linkMatch = { workspace: workspaceId };
    if (campaignIds.length > 0) {
      linkMatch.campaign = { $in: campaignIds };
    }
    if (startDate) {
      linkMatch.createdAt = { $gte: startDate };
    }

    // 1. Run Aggregation for Overall Prospect KPIs & Stages
    const [prospectStats, stagesAgg, drAgg, linkStats, linkRelAgg] = await Promise.all([
      Prospect.aggregate([
        { $match: prospectMatch },
        {
          $group: {
            _id: null,
            totalProspects: { $sum: 1 },
            contactFound: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$status',
                      [
                        'contact_found',
                        'email_sent',
                        'followup_sent',
                        'replied',
                        'negotiating',
                        'agreed',
                        'link_live',
                      ],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            emailsSent: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$status',
                      ['email_sent', 'followup_sent', 'replied', 'negotiating', 'agreed', 'link_live'],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            replies: {
              $sum: {
                $cond: [
                  {
                    $in: ['$status', ['replied', 'negotiating', 'agreed', 'link_live']],
                  },
                  1,
                  0,
                ],
              },
            },
            negotiating: {
              $sum: {
                $cond: [
                  {
                    $in: ['$status', ['negotiating', 'agreed', 'link_live']],
                  },
                  1,
                  0,
                ],
              },
            },
            linksWon: {
              $sum: {
                $cond: [{ $eq: ['$status', 'link_live'] }, 1, 0],
              },
            },
            lost: {
              $sum: {
                $cond: [{ $eq: ['$status', 'lost'] }, 1, 0],
              },
            },
          },
        },
      ]),

      // Count by individual 9 stages
      Prospect.aggregate([
        { $match: prospectMatch },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Average DR of prospects with DR > 0
      Prospect.aggregate([
        { $match: { ...prospectMatch, 'metrics.dr': { $gt: 0 } } },
        {
          $group: {
            _id: null,
            avgDr: { $avg: '$metrics.dr' },
            countWithDr: { $sum: 1 },
          },
        },
      ]),

      // Aggregate Links stats
      Link.aggregate([
        { $match: linkMatch },
        {
          $group: {
            _id: null,
            totalLinksRecorded: { $sum: 1 },
            liveLinksCount: {
              $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] },
            },
            totalSpend: {
              $sum: { $cond: [{ $eq: ['$status', 'live'] }, '$cost', 0] },
            },
            paidLinksCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'live'] },
                      { $gt: ['$cost', 0] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            freeLinksCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'live'] },
                      { $lte: ['$cost', 0] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),

      // Link breakdown by rel type (dofollow, nofollow, sponsored, ugc)
      Link.aggregate([
        { $match: { ...linkMatch, status: 'live' } },
        {
          $group: {
            _id: '$rel',
            count: { $sum: 1 },
            totalCost: { $sum: '$cost' },
          },
        },
      ]),
    ]);

    const pKpi = prospectStats[0] || {
      totalProspects: 0,
      contactFound: 0,
      emailsSent: 0,
      replies: 0,
      negotiating: 0,
      linksWon: 0,
      lost: 0,
    };

    const lKpi = linkStats[0] || {
      totalLinksRecorded: 0,
      liveLinksCount: 0,
      totalSpend: 0,
      paidLinksCount: 0,
      freeLinksCount: 0,
    };

    const avgDr = drAgg[0]?.avgDr ? Math.round(drAgg[0].avgDr * 10) / 10 : 0;

    // Use higher of prospect link_live or Link records for won count
    const effectiveWon = Math.max(pKpi.linksWon, lKpi.liveLinksCount);
    const replyRate = pKpi.emailsSent > 0
      ? Math.round((pKpi.replies / pKpi.emailsSent) * 1000) / 10
      : 0;
    const winRate = pKpi.replies > 0
      ? Math.round((effectiveWon / pKpi.replies) * 1000) / 10
      : 0;
    const overallConversion = pKpi.totalProspects > 0
      ? Math.round((effectiveWon / pKpi.totalProspects) * 1000) / 10
      : 0;
    const costPerLink = effectiveWon > 0
      ? Math.round((lKpi.totalSpend / effectiveWon) * 100) / 100
      : 0;

    // Build stage distribution
    const stageCountsMap = {};
    stagesAgg.forEach((s) => {
      stageCountsMap[s._id] = s.count;
    });

    const STAGE_ORDER = [
      { key: 'new', label: 'New' },
      { key: 'contact_found', label: 'Contact Found' },
      { key: 'email_sent', label: 'Email Sent' },
      { key: 'followup_sent', label: 'Follow-up Sent' },
      { key: 'replied', label: 'Replied' },
      { key: 'negotiating', label: 'Negotiating' },
      { key: 'agreed', label: 'Agreed' },
      { key: 'link_live', label: 'Link Live' },
      { key: 'lost', label: 'Lost' },
    ];

    const stages = STAGE_ORDER.map((st) => ({
      key: st.key,
      label: st.label,
      count: stageCountsMap[st.key] || 0,
    }));

    // Funnel Steps
    const funnel = [
      {
        stage: 'prospects',
        label: 'Total Prospects',
        count: pKpi.totalProspects,
        pct: 100,
      },
      {
        stage: 'contacted',
        label: 'Emails Sent',
        count: pKpi.emailsSent,
        pct: pKpi.totalProspects > 0 ? Math.round((pKpi.emailsSent / pKpi.totalProspects) * 100) : 0,
      },
      {
        stage: 'replied',
        label: 'Replies Received',
        count: pKpi.replies,
        pct: pKpi.emailsSent > 0 ? Math.round((pKpi.replies / pKpi.emailsSent) * 100) : 0,
      },
      {
        stage: 'negotiating',
        label: 'In Negotiation',
        count: pKpi.negotiating,
        pct: pKpi.replies > 0 ? Math.round((pKpi.negotiating / pKpi.replies) * 100) : 0,
      },
      {
        stage: 'link_live',
        label: 'Links Won',
        count: effectiveWon,
        pct: pKpi.negotiating > 0 ? Math.round((effectiveWon / pKpi.negotiating) * 100) : 0,
      },
    ];

    // 2. Timeline Activity (Last 14 days or 30 days)
    const daysToShow = range === '7d' ? 7 : range === 'month' ? 30 : 14;
    const activityTimeline = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().substring(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      activityTimeline.push({ date: dateStr, label, sent: 0, replies: 0, won: 0 });
    }

    const timelineStart = new Date(Date.now() - daysToShow * 24 * 60 * 60 * 1000);

    // Group prospects by creation date and status history in this window
    const [timelineProspects, timelineLinks] = await Promise.all([
      Prospect.aggregate([
        {
          $match: {
            workspace: workspaceId,
            ...(campaignIds.length > 0 ? { campaign: { $in: campaignIds } } : {}),
            createdAt: { $gte: timelineStart },
          },
        },
        {
          $group: {
            _id: { $substr: [{ $dateToString: { date: '$createdAt' } }, 0, 10] },
            created: { $sum: 1 },
            sent: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$status',
                      ['email_sent', 'followup_sent', 'replied', 'negotiating', 'agreed', 'link_live'],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            replies: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['replied', 'negotiating', 'agreed', 'link_live']] },
                  1,
                  0,
                ],
              },
            },
            won: {
              $sum: { $cond: [{ $eq: ['$status', 'link_live'] }, 1, 0] },
            },
          },
        },
      ]),
      Link.aggregate([
        {
          $match: {
            workspace: workspaceId,
            status: 'live',
            ...(campaignIds.length > 0 ? { campaign: { $in: campaignIds } } : {}),
            liveDate: { $gte: timelineStart },
          },
        },
        {
          $group: {
            _id: { $substr: [{ $dateToString: { date: '$liveDate' } }, 0, 10] },
            won: { $sum: 1 },
            spend: { $sum: '$cost' },
          },
        },
      ]),
    ]);

    const timelineMap = new Map();
    timelineProspects.forEach((t) => timelineMap.set(t._id, t));
    const linkTimelineMap = new Map();
    timelineLinks.forEach((l) => linkTimelineMap.set(l._id, l));

    activityTimeline.forEach((point) => {
      const pEntry = timelineMap.get(point.date);
      const lEntry = linkTimelineMap.get(point.date);
      point.sent = pEntry ? pEntry.sent : 0;
      point.replies = pEntry ? pEntry.replies : 0;
      point.won = (lEntry ? lEntry.won : 0) || (pEntry ? pEntry.won : 0);
    });

    // 3. Link Breakdown by Rel
    const totalRelLinks = linkRelAgg.reduce((acc, r) => acc + r.count, 0);
    const linkBreakdown = {
      byRel: linkRelAgg.map((r) => ({
        rel: r._id || 'dofollow',
        count: r.count,
        pct: totalRelLinks > 0 ? Math.round((r.count / totalRelLinks) * 1000) / 10 : 0,
        totalCost: r.totalCost,
      })),
      paidCount: lKpi.paidLinksCount,
      freeCount: lKpi.freeLinksCount,
      totalSpend: lKpi.totalSpend,
      avgCost: costPerLink,
    };

    // 4. Campaign Performance Breakdown
    const campaignFilter = { workspace: workspaceId };
    if (campaign && campaign !== 'all') {
      campaignFilter._id = campaign;
    } else if (client && client !== 'all') {
      campaignFilter.client = client;
    }

    const campaigns = await Campaign.find(campaignFilter)
      .populate('client', 'name domain')
      .sort({ createdAt: -1 })
      .lean();

    const campIds = campaigns.map((c) => c._id);
    let campaignPerformance = [];

    if (campIds.length > 0) {
      const [campProspectAgg, campLinkAgg] = await Promise.all([
        Prospect.aggregate([
          { $match: { campaign: { $in: campIds }, workspace: workspaceId } },
          {
            $group: {
              _id: '$campaign',
              totalProspects: { $sum: 1 },
              emailsSent: {
                $sum: {
                  $cond: [
                    {
                      $in: [
                        '$status',
                        ['email_sent', 'followup_sent', 'replied', 'negotiating', 'agreed', 'link_live'],
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              replies: {
                $sum: {
                  $cond: [
                    { $in: ['$status', ['replied', 'negotiating', 'agreed', 'link_live']] },
                    1,
                    0,
                  ],
                },
              },
              linksWon: {
                $sum: { $cond: [{ $eq: ['$status', 'link_live'] }, 1, 0] },
              },
            },
          },
        ]),
        Link.aggregate([
          { $match: { campaign: { $in: campIds }, workspace: workspaceId, status: 'live' } },
          {
            $group: {
              _id: '$campaign',
              totalCost: { $sum: '$cost' },
              liveCount: { $sum: 1 },
            },
          },
        ]),
      ]);

      const cPMap = new Map();
      campProspectAgg.forEach((cp) => cPMap.set(String(cp._id), cp));
      const cLMap = new Map();
      campLinkAgg.forEach((cl) => cLMap.set(String(cl._id), cl));

      campaignPerformance = campaigns.map((c) => {
        const cp = cPMap.get(String(c._id)) || {
          totalProspects: 0,
          emailsSent: 0,
          replies: 0,
          linksWon: 0,
        };
        const cl = cLMap.get(String(c._id)) || { totalCost: 0, liveCount: 0 };

        const won = Math.max(cp.linksWon, cl.liveCount);
        const goal = c.goalLinks || 0;
        const linksProgress = goal > 0 ? Math.min(100, Math.round((won / goal) * 100)) : 0;
        const repRate = cp.emailsSent > 0 ? Math.round((cp.replies / cp.emailsSent) * 1000) / 10 : 0;
        const cPerLink = won > 0 ? Math.round((cl.totalCost / won) * 100) / 100 : 0;

        return {
          _id: c._id,
          name: c.name,
          type: c.type,
          status: c.status,
          client: c.client ? { _id: c.client._id, name: c.client.name, domain: c.client.domain } : null,
          prospects: cp.totalProspects,
          emailsSent: cp.emailsSent,
          replies: cp.replies,
          replyRate: repRate,
          linksWon: won,
          goalLinks: goal,
          linksProgress,
          spend: cl.totalCost,
          budget: c.budget || 0,
          costPerLink: cPerLink,
        };
      });
    }

    res.json({
      success: true,
      data: {
        kpis: {
          totalProspects: pKpi.totalProspects,
          emailsSent: pKpi.emailsSent,
          replies: pKpi.replies,
          replyRate,
          linksWon: effectiveWon,
          winRate,
          overallConversion,
          totalSpend: lKpi.totalSpend,
          costPerLink,
          avgDr,
        },
        funnel,
        stages,
        activityTimeline,
        linkBreakdown,
        campaignPerformance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /reports/export?range=&client=&campaign=&type=campaigns|prospects|links
export const exportReportCsv = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId;
    const { range = '30d', client, campaign, type = 'campaigns' } = req.query;

    const startDate = getStartDateFromRange(range);

    let campaignIds = [];
    if (campaign && campaign !== 'all') {
      campaignIds = [campaign];
    } else if (client && client !== 'all') {
      const clientCampaigns = await Campaign.find({
        workspace: workspaceId,
        client: client,
      }).select('_id');
      campaignIds = clientCampaigns.map((c) => c._id);
    }

    let csvData = [];
    let filename = `outreach-report-${type}-${new Date().toISOString().substring(0, 10)}.csv`;

    if (type === 'prospects') {
      const query = { workspace: workspaceId };
      if (campaignIds.length > 0) query.campaign = { $in: campaignIds };
      if (startDate) query.createdAt = { $gte: startDate };

      const prospects = await Prospect.find(query)
        .populate('campaign', 'name')
        .sort({ createdAt: -1 })
        .limit(1000)
        .lean();

      csvData = prospects.map((p) => ({
        Domain: p.domain,
        PageUrl: p.pageUrl || '',
        ContactName: p.contactName || '',
        ContactEmail: p.contactEmail || '',
        Status: p.status,
        DR: p.metrics?.dr || 0,
        Traffic: p.metrics?.traffic || 0,
        Campaign: p.campaign?.name || '',
        NextFollowUpAt: p.nextFollowUpAt ? new Date(p.nextFollowUpAt).toISOString().substring(0, 10) : '',
        CreatedAt: new Date(p.createdAt).toISOString().substring(0, 10),
      }));
    } else if (type === 'links') {
      const query = { workspace: workspaceId };
      if (campaignIds.length > 0) query.campaign = { $in: campaignIds };
      if (startDate) query.createdAt = { $gte: startDate };

      const links = await Link.find(query)
        .populate('campaign', 'name')
        .populate('prospect', 'domain')
        .sort({ liveDate: -1 })
        .limit(1000)
        .lean();

      csvData = links.map((l) => ({
        SourceURL: l.sourceUrl,
        TargetURL: l.targetUrl || '',
        AnchorText: l.anchorText || '',
        RelType: l.rel,
        Status: l.status,
        Cost: l.cost || 0,
        LiveDate: l.liveDate ? new Date(l.liveDate).toISOString().substring(0, 10) : '',
        Campaign: l.campaign?.name || '',
        ProspectDomain: l.prospect?.domain || '',
        Notes: l.notes || '',
      }));
    } else {
      // Default: campaigns performance summary
      const campFilter = { workspace: workspaceId };
      if (campaign && campaign !== 'all') campFilter._id = campaign;
      else if (client && client !== 'all') campFilter.client = client;

      const campaigns = await Campaign.find(campFilter)
        .populate('client', 'name domain')
        .sort({ createdAt: -1 })
        .lean();

      const cIds = campaigns.map((c) => c._id);
      const [prospectAgg, linkAgg] = await Promise.all([
        Prospect.aggregate([
          { $match: { campaign: { $in: cIds }, workspace: workspaceId } },
          {
            $group: {
              _id: '$campaign',
              totalProspects: { $sum: 1 },
              emailsSent: {
                $sum: {
                  $cond: [
                    {
                      $in: [
                        '$status',
                        ['email_sent', 'followup_sent', 'replied', 'negotiating', 'agreed', 'link_live'],
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              replies: {
                $sum: {
                  $cond: [
                    { $in: ['$status', ['replied', 'negotiating', 'agreed', 'link_live']] },
                    1,
                    0,
                  ],
                },
              },
              linksWon: {
                $sum: { $cond: [{ $eq: ['$status', 'link_live'] }, 1, 0] },
              },
            },
          },
        ]),
        Link.aggregate([
          { $match: { campaign: { $in: cIds }, workspace: workspaceId, status: 'live' } },
          {
            $group: {
              _id: '$campaign',
              totalCost: { $sum: '$cost' },
              liveCount: { $sum: 1 },
            },
          },
        ]),
      ]);

      const cpMap = new Map();
      prospectAgg.forEach((cp) => cpMap.set(String(cp._id), cp));
      const clMap = new Map();
      linkAgg.forEach((cl) => clMap.set(String(cl._id), cl));

      csvData = campaigns.map((c) => {
        const cp = cpMap.get(String(c._id)) || { totalProspects: 0, emailsSent: 0, replies: 0, linksWon: 0 };
        const cl = clMap.get(String(c._id)) || { totalCost: 0, liveCount: 0 };
        const won = Math.max(cp.linksWon, cl.liveCount);
        const replyRate = cp.emailsSent > 0 ? ((cp.replies / cp.emailsSent) * 100).toFixed(1) + '%' : '0%';
        const costPerLink = won > 0 ? '$' + (cl.totalCost / won).toFixed(2) : '$0.00';

        return {
          CampaignName: c.name,
          Client: c.client?.name || 'Internal',
          Status: c.status,
          CampaignType: c.type,
          TotalProspects: cp.totalProspects,
          EmailsSent: cp.emailsSent,
          Replies: cp.replies,
          ReplyRate: replyRate,
          LinksWon: won,
          GoalLinks: c.goalLinks || 0,
          TotalSpend: '$' + (cl.totalCost || 0).toFixed(2),
          Budget: '$' + (c.budget || 0).toFixed(2),
          CostPerLink: costPerLink,
        };
      });
    }

    const csvString = Papa.unparse(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvString);
  } catch (error) {
    next(error);
  }
};
