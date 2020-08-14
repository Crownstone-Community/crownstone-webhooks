
export function generateFilterFromScope(scopes : string[], userId: string): ScopeFilter | true {
  if (scopes.indexOf("all") !== -1) {
    return true;
  }

  let scopeFilter : ScopeFilter = {};

  if (scopes.indexOf("user_location") !== -1) {
    if (scopeFilter["presence"] === undefined) { scopeFilter["presence"] = {}; }
    scopeFilter["presence"]["*"] = (eventData) => { return eventData.user.id === userId; };
  }


  if (scopes.indexOf("stone_information") !== -1) {
    if (scopeFilter["dataChange"]        === undefined) { scopeFilter["dataChange"] = {}; }
    if (scopeFilter["abilityChange"]     === undefined) { scopeFilter["abilityChange"] = {}; }
    if (scopeFilter["switchStateUpdate"] === undefined) { scopeFilter["switchStateUpdate"] = {}; }

    scopeFilter["dataChange"]["stones"]       = () => true;
    scopeFilter["abilityChange"]["*"]         = () => true;
    scopeFilter["switchStateUpdate"]["stone"] = () => true;
  }


  if (scopes.indexOf("sphere_information") !== -1) {
    if (scopeFilter["dataChange"] === undefined) { scopeFilter["dataChange"] = {}; }
    scopeFilter["dataChange"]["stones"]    = () => true;
    scopeFilter["dataChange"]["locations"] = () => true;
    scopeFilter["dataChange"]["spheres"]   = () => true;
  }


  if (scopes.indexOf("switch_stone") !== -1) {
    if (scopeFilter["command"] === undefined) { scopeFilter["command"] = {}; }
    scopeFilter["command"]["switchCrownstone"] = () => true;
    scopeFilter["command"]["multiSwitch"]      = () => true;
  }


  if (scopes.indexOf("location_information") !== -1) {
    if (scopeFilter["dataChange"] === undefined) { scopeFilter["dataChange"] = {}; }
    scopeFilter["dataChange"]["locations"] = () => true;
  }


  if (scopes.indexOf("user_information") !== -1) {
    if (scopeFilter["dataChange"] === undefined) { scopeFilter["dataChange"] = {}; }
    scopeFilter["dataChange"]["users"] = (eventData) => { return eventData.changedItem.id === userId; }
  }


  // if (scopes.indexOf("power_consumption") !== -1) {}
  // if (scopes.indexOf("user_id")          !== -1) {}

  return scopeFilter;
}


export function checkScopePermissions(scopeFilter: ScopeFilter | true, eventData: SseDataEvent) : boolean {
  if (scopeFilter === true) {
    return true;
  }

  let typeFilter = scopeFilter[eventData.type];
  if (typeFilter) {
    if (typeFilter["*"] !== undefined) {
      return typeFilter["*"](eventData);
    }
    else {
      let subType : string = "";
      if ("subType" in eventData) {
        subType = eventData.subType
      }
      else if ("operation" in eventData) {
        subType = eventData.operation
      }
      if (typeFilter[subType] !== undefined) {
        return typeFilter[subType](eventData);
      }
    }
  }

  return false;
}
