
export function makeUser(name : string) {
  return {
    name: name,
  }
}


export function generateMike() {
  return makeUser("Mike Anderson")
}

