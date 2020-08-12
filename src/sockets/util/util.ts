
export const Util = {
  getShortUUID: function() : string {
    return (S4() + S4() + '-' + S4());
  },

  getUUID: function() : string {
    return (
      S4() + S4() + '-' +
      S4() + '-' +
      S4() + '-' +
      S4() + '-' +
      S4() + S4() + S4()
    );
  },
}

const S4 = function () {
  return Math.floor(Math.random() * 0x10000 /* 65536 */).toString(16);
};
