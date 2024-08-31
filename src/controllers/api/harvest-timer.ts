import fastifyPlugin from 'fastify-plugin';

import { JiraIssue } from '~/types/jira/jira-issue';

export default fastifyPlugin(async (app, options) => {
  app.post('/api/harvest-timer', options, async (req, reply) => {
    try {
      const secret = req.headers['x-harvest-start-timer-secret'];
      if (secret !== process.env.HARVEST_START_TIMER_SECRET) {
        return reply.status(401).send();
      }

      const event = req.body as { issue: JiraIssue };
      if (!event.issue.fields.parent) return reply.status(200).send();

      const [project, epic] = await app.database.$transaction([
        app.database.project.findUnique({
          where: { code: event.issue.fields.project.key },
        }),
        app.database.epic.findUnique({
          where: { code: event.issue.fields.parent.key },
        }),
      ]);

      if (project && epic) {
        await app.harvest.startTimer(project, epic, event.issue);
      }

      return reply.status(200).send();
    } catch {
      return reply.status(500).send();
    }
  });
});
