apim-portal-light
=========
## Build Process

```
git clone https://github.com/yschiang/apim-portal-light.git
cd apim-portal-light
edit app.js
  Line 18 app.set('PORTAL_HOST', '1.1.1.1');	// 改成你們的 portal ip
  Line 19 app.set('PORTAL_CONTEXT', 'xyz.sb');	// 改成你們的 portal context, 例如 https://1.1.1.1/xyz/sb/ 則為 "xyz.sb"
npm install
```

## Run Process
```
npm start
```
Then use browser to visit 
```
http://<server-ip>:3000/step1
```
