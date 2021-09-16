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


# How do I use it?
Take a look at the API documentation here: [webhook api](./REST.md)