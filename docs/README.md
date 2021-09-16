# Welcome to the Crownstone Webhook server!

So what is this? Well, there are a lot of things happening with your Crownstones!
Every time there is a change in your Sphere, you can get an event from the event server. This is useful if you're listening for events, but what if you have a server
that needs to be called when a change occurs?
That is why this webhook server exists!


# How does it work?
You can request an account to use webhooks from Crownstone via %ask[at]crownstone.rocks%. 

When you have an account, I'll assume you can also get OAUTH2 tokens from the users whose events you'd like to receive.

The available events (assuming you have the right OAUTH access scope for them) are:

- [Command events](https://github.com/crownstone/crownstone-lib-nodejs-sse#command-events)
- [resence events](https://github.com/crownstone/crownstone-lib-nodejs-sse#presence-events)
- [Data change events](https://github.com/crownstone/crownstone-lib-nodejs-sse#data-change-events)
- [Invitation change events](https://github.com/crownstone/crownstone-lib-nodejs-sse#invitation-change-events)

You can subscribe to these using their toplevel type:
- **command**
- **presence**
- **dataChange**
- **abilityChange**
- **invitationChange**
- **switchStateUpdate**

# Access Scope
Crownstone's OAUTH2 security has the following scopes and event access:
- **all**
  - all events.
- **user_location** 
  - all presence events as long as the userId matches the token's owner ID.
- **stone_information**    
  - dataChange for stones, abilityChange, switchStateUpdate.
- **sphere_information**   
  - dataChange for stones, locations and spheres.
- **switch_stone**         
  - all command events.
- **location_information** 
  - dataChange for locations (rooms).
- **user_information**     
  - dataChange for users with the userId of the token's owner.
- **power_consumption**    
  - no specific events.
- **user_id**              
  - no specific events.

# How do I use it?
Take a look at the API here: [webhook api](./api/explorer)

You're a *User*. For each user of your service, you'll have a Crownstone OAUTH token. For each token you have you can create one or more *Listeners*. Listeners subscribe to their events and forward them to your url.

Use your API KEY to authorize your requests.

When a listener's token expires, the listeners will be automatically deleted. You can check if they are still actively listening using:
[GET /listeners/active](./api/explorer)

You can create a new listener here:
[POST /listeners](./api/explorer)
```
{
  "token":  string,   // this is the access or oauth token
  "userId": string,   // this is the crownstone user id that belongs to this token
  "eventTypes": [     // an array of event types (listed above) that you'd like to get delivered to the url:
    string
  ],
  "url": string       // the url that will be called if an event is forwarded to it.
}
```

In case you have multiple listeners with the same token (so you have multiple endpoints on your side invoked), and a listener removes their account with you, use this command to clean up:
[DELETE /listeners/token](./api/explorer)

# How is my endpoint invoked?

We will call the provided url with a POST request and the following data payload:
```
{
  "clientId":     string,  // this is the ID of your Crownstone Webhook user
  "clientSecret": string,  // this is the secret string you received together with your API KEY.
  "userId":       string,  // this is the userId that belongs to the Crownstone user whose token has received this event
  "data":         SseData  // this is the event payload as described in the sse repository.
}
```
