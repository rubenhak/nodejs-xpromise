# Node.js BlueBird Promsie Extension Library
Enhances BlueBird promise library with useful capabilites.

## Promise.serial
Used for running multiple promises in sequence. If one operation fails the processing fails, root promise stops execution and fails.

**Signature:**

Promise.serial(items, callback) : returns Promise.

**callback** can return Promise. In those cases root Promise will wait this Promise to succeed before proceeding to next iten.

**Usage:**
```js
var items = ['cat', 'dog', 'elephant'];
Promise.serial(items, x => {
    return doSomething(x);
})
.then(() => console.log("All Items Processed!"))

function doSomething(name)
{
    return db.insert(name);
}
```

## Promise.parallel
Used for running multiple promises in parallel. If one operation fails the processing should continue. Nevertheles the top promise should fail.

**Signature:**

Promise.parallel(items, callback) : returns Promise.

**callback** can return Promise. The top Promise should wait for all inner Promises to finish processing.

**Usage:**
```js
var items = ['cat', 'dog', 'elephant'];
Promise.serial(items, x => {
    return doSomething(x);
})
.then(() => console.log("All Items Processed!"))

function doSomething(name)
{
    return db.insert(name);
}
```

## Promise.timeout
Promise which waits and resolves in specified amount of time.

**Signature:**

Promise.timeout(ms) : returns Promise.

**Usage:**
```js
var items = ['cat', 'dog', 'elephant'];
Promise.serial(items, x => {
    return doSomething(x);
})
.

function doSomething(name)
{
    return db.insert(name);
}
```

## Promise.retry
Enables retry capability.

**Signature:**

Promise.retry(action, number, timeout, canContinueCb) : returns Promise.

**action**: action to perform. Can return Promise.

**number**: maximum number of times to retry.

**timeout**: timeout in ms to retry.

**canContinueCb**: An optional callback which tells whether a particual retry can be executed


**Usage 1:**
```js
return Promise.retry(() => doSomething(), 3, 1000);

function doSomething()
{
    return db.insert('Example');
}
```

**Usage 2:**
```js
Promise.retry(() => doSomething(), 3, 1000, () => {
    if (new Date().getHours() > 10) {
        return false;
    }
    return true;
});

function doSomething()
{
    return db.insert('Example');
}
```


## Publishing

```sh
$ ./publish.sh
```

### Updating NPM Key
```sh
$ travis encrypt <NPM-KEY-GOES-HERE> --add deploy.api_key
```