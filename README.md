# ReactFBLogin

> A Component React for Facebook Login

## Getting Started

- `yarn add https://github.com/jiraiya103/react-fb-login.git` or
- `npm install https://github.com/jiraiya103/react-fb-login.git`
- Your application will also need `react-dom` and `react` installed.

## How to use

### Basic button with styling

```js
import React from 'react';
import ReactDOM from 'react-dom';
import ReactFBLogin, { ReactFBLoginInfo, ReactFBFailureResponse } from 'react-fb-login';

const responseFacebook = (response: ReactFBLoginInfo | ReactFBFailureResponse) => {
  console.log(response);
}

ReactDOM.render(
  <ReactFBLogin
      appId={FACEBOOK_APP_ID}
      fields="name,email,picture"
      callback={responseFacebook}
      render={({ onClick, disabled, isProcessing }) => (
          <YourButton
              disabled={disabled || isProcessing}
              style={{
                  opacity: disabled || isProcessing ? 0.5 : 1
              }}
              onClick={onClick}
          >
              Login
          </YourButton>
      )}
  />,
  document.getElementById('root')
);
```
