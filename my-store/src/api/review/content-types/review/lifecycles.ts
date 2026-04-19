
export default {
  beforeCreate(event: any) {
    const { data } = event.params;
    const hasScript = (val: any) => typeof val === 'string' && /<\/?[^>]+(>|$)/g.test(val);

    if (hasScript(data.comment) || hasScript(data.username)) {
      throw new Error('Security Error: HTML tags are not allowed in reviews.');
    }
  },

  beforeUpdate(event: any) {
    const { data } = event.params;
    const hasScript = (val: any) => typeof val === 'string' && /<\/?[^>]+(>|$)/g.test(val);

    if (hasScript(data.comment) || hasScript(data.username)) {
      throw new Error('Security Error: HTML tags are not allowed in reviews.');
    }
  },
};
