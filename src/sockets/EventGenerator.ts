

export const EventGenerator = {

  getStartEvent() : string {
    let startEvent: SystemEvent = {
      type:    "system",
      subType: "STREAM_START",
      code:     200,
      message: "Stream Starting."
    };
    return "data:" + JSON.stringify(startEvent) + '\n\n';
  },

  getErrorEvent(code : number, subType: SystemSubType, message: string) : string {
    let startEvent: SystemEvent = {
      type:    "system",
      subType:  subType,
      code:     code,
      message:  message,
    };
    return "data:" + JSON.stringify(startEvent) + '\n\n';
  }
}