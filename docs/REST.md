# Webhook REST API

In order to make the documentation a bit more readable, the prefix `https://webhooks.crownstone.rocks/api` is removed from the endpoint descriptions.
Using any endpoint can be done by adding the endpoint to the prefix like `https://webhooks.crownstone.rocks/api/users/isValidApiKey`.


## Authorization

If you do not have a webhook user account, please contact us to get one!

Once you have your account, you can use your API_KEY to access the webhook service. The API_KEY should be added to the header of your request.

Like so:
```js
const header = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  "API_KEY": "N2eqcnDVWFBtbAjBYGeQQl5Gc52AhzUh74NpOXC23Ahhbhqvz75bso3XWGzKtEfg"
}
```

## Overview

You're a *User*. For each user of your service, you'll have a Crownstone OAUTH token. For each token you have you can create one or more *Listeners*. Listeners subscribe to their events and forward them to your url.

Use your API KEY to authorize your requests.

When a listener's token expires, the listeners will be automatically deleted. You can check if they are still actively listening using: GET /listeners/active


## How is my endpoint invoked?

We will call the provided url with a POST request and the following data payload:
```
{
  "clientId":     string,  // this is the ID of your Crownstone Webhook user
  "clientSecret": string,  // this is the secret string you received together with your API KEY.
  "userId":       string,  // this is the userId that belongs to the Crownstone user whose token has received this event
  "data":         SseData  // this is the event payload as described in the sse repository.
}
```


# UserController

This controller is mostly for Crownstone use, it is there for webhook  user management. The only relevant endpoint for someone without admin access is this one:
<details>
<summary>GET /users/isValidApiKey</summary>

> If this returns true, your API key is valid.
>
> Response code: <b>200 | 401</b>
>
> Reply format:
> ```js
> true
 >```
</details>

# ListenerController

This is where you'll be spending most of your time. A listener is a Crownstone Cloud user that uses a service you control. You probably have an OAUTH access token for each Crownstone user
which uses your service.

<details>
<summary>GET /listeners</summary>

> This returns a list of listeners you have registered webhooks for.
>
> Response code: <b>200</b>
>
> Reply format:
> ```js
> [
>   {
>     "id":           string,   // the ID of this listener
>     "token":        string,   // the access/OAUTH token that represents this user
>     "userId":       string,   // the userId of this user on the Crownstone Cloud
>     "expiresAt":    string,   // when your token expires and the listener will be deleted
>     "eventTypes":   string[], // array of SSE event types to forward to the url. All possible events listed below.
>     "url":          string,   // the url to forward the data to
>     "ownerId":      string    // the ID of your users
>   },
>   ...
> ]
> ```
</details>



<details>
<summary>POST /listeners</summary>

> Add a listener for a Crownstone user. The types of events that match the eventTypes (and are allowed within your OAUTH scope) will 
> be forwarded to your URL.
> 
> You can create listeners multiple times. As long as the eventTypes, userId and url are the same as an existing listener, the 
> token will be updated and no duplicate listener is created.
>
> Request format:
> ```js
> {
>   "token":        string,   // the access/OAUTH token that represents this user
>   "userId":       string,   // the userId of this user on the Crownstone Cloud
>   "eventTypes":   string[], // array of SSE event types to forward to the url. All possible events listed below.
>   "url":          string,   // the url to forward the data to
> }
> ```
> 
> Response code: <b>200</b>
>
> Reply format:
> ```js
> {
>   "id":           string,   // the ID of this listener
>   "token":        string,   
>   "userId":       string,   
>   "expiresAt":    string,   // when your token expires and the listener will be deleted
>   "eventTypes":   string[], 
>   "url":          string,   
>   "ownerId":      string    // the ID of your users
> }
> ```
</details>


<details>
<summary>GET /listeners/active</summary>

> Check if you have already registered a listener for Crownstone user with the userId Crownstone Cloud id.
> 
>
> Request format:
>  - userId as query parameter like:
>   ```
>   https://webhooks.crownstone.rocks/api/listeners/active?userId=58bcd2aadf42e8c330b5fd62
>   ```
>
> Response code: <b>200</b>
>
> Reply format:
> ```js
> boolean
> ```
</details>

<details>
<summary>DELETE /listeners/{id}</summary>

> Delete a certain listener by it's listener id.
> 
>
> Request format:
>  - listenerId as path parameter like:
>   ```
>   https://webhooks.crownstone.rocks/api/listeners/58bcd2aadf42e8c330b5fd62
>   ```
>
> Response code: <b>200</b>
>
> Reply format:
> Count of deleted listerners.
> ```js
> {
>    count: number
> }
> ```
</details>


<details>
<summary>DELETE /listeners/userId</summary>

> Delete all listeners that you have registered with a certain Crownstone Cloud id. This is usually done when you 
> want to remove all existing listeners from a Crownstone user, when they leave your service for instance.
>
>
> Request format:
>  - userId as query parameter like:
>   ```
>   https://webhooks.crownstone.rocks/api/listeners/userId?userId=58bcd2aadf42e8c330b5fd62
>   ```
>
> Response code: <b>200</b>
>
> Reply format:
> Count of deleted listerners.
> ```js
> {
>    count: number
> }
> ```
</details>

# Event Types

These are the event types you can use in in the eventType string array.
- **command**
- **presence**
- **dataChange**
- **abilityChange**
- **invitationChange**
- **switchStateUpdate**

# Access scopes

OAUTH tokens have scopes, allowing access to a number of events. Here is a list with the available scopes and the events it allows access to.

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
