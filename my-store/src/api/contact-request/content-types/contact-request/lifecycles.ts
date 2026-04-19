
export default {
  beforeCreate(event: any) {
    const { data } = event.params;
    const hasScript = (val: any) => typeof val === 'string' && /<\/?[^>]+(>|$)/g.test(val);

    if (hasScript(data.fullName) || hasScript(data.email) || hasScript(data.phone)) {
      throw new Error('Security Error: HTML tags are not allowed in contact requests.');
    }
  },

  beforeUpdate(event: any) {
    const { data } = event.params;
    const hasScript = (val: any) => typeof val === 'string' && /<\/?[^>]+(>|$)/g.test(val);

    if (hasScript(data.fullName) || hasScript(data.email) || hasScript(data.phone)) {
      throw new Error('Security Error: HTML tags are not allowed in contact requests.');
    }
  },
};
