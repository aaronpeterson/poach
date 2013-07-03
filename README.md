#Poach

Poach is a work in progress and currently only provides anti-collision on usernames seeded by PassportJS oauth strategies. Don't use this right now. It's sort of in proof-of-concept stage.  I needed something that would extend PassportJS beyond authentication.

For example, in a Passport Twitter strategy implementation, you might seed Poach.user() with Passport's profile.username.

```js
// create account
Poach.user(profile.username, usernameAvailable, function(err, newUsername) {
  if (err) console.log(err);

  user = new User({
    name: profile.displayName,
    username: newUsername,
    provider: 'twitter',
    twitter: profile._json
  });

  user.save(function(err) {
    if (err) console.log(err)
    done(err, user)
  });
});
```

The above example uses usernameAvailable as its username availability callback, which for a Mongoose User model might look like this:

```js
// username availability callback for Poach
var usernameAvailable = function(username, callback) {
  User.findOne({username:username}, function(err, user) {
    if (err) return callback(err);

    if (!user) return callback(null, true);

    return callback(null, false);
  });
}
```