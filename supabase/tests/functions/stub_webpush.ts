// Pretend web-push: records every notification instead of sending it.
export const sent: { endpoint: string; payload: string }[] = [];
export default {
  setVapidDetails() {},
  async sendNotification(sub: { endpoint: string }, payload: string) {
    if (sub.endpoint.includes('gone')) throw Object.assign(new Error('gone'), { statusCode: 410 });
    sent.push({ endpoint: sub.endpoint, payload });
  },
};
