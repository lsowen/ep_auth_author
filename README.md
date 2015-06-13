# ep_auth_author
Hooks into etherpad-lite authentication and gives users the same authorId each time they log in

# Install

In your etherpad-lite dir:

```
npm install ep_auth_author
```

Add a prefix to settings.json to distinguish between normal BasicAuth users and users controlled by ep_auth_author.  Also add ep_auth_author users to the `users` object in settings.json.

Example:

```
{
  "ep_auth_author": {
    "prefix": "author/"
  },
  "users": {
    "author/user": {
      "is_admin": false,
      "authorName": "Test User",
      "password": "changeme1"
    },
    "admin": {
      "is_admin": true,
      "password": "changeme1"
    }
  }
}
```

In this example, the prefix which identifies the user as being managed by ep_auth_author is `author/`.  So the user `author/user` would log in with the username `user` and the password `changeme1`, which would "reconnect" the previous author (and thus user set edit color and author name) with the new login.  The optional `authorName` field can be used to set the default author name for that user.

The `admin` user is handled by the normal BasicAuth authentication, and does not "reconnect" previously set options.