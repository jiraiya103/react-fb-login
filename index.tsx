import React, { useEffect, useState } from 'react'

const __window: any = window

const getIsMobile = () => {
    let isMobile = false

    try {
        isMobile = !!(
            ((window as any).navigator &&
                (window as any).navigator.standalone) ||
            navigator.userAgent.match('CriOS') ||
            navigator.userAgent.match(/mobile/i)
        )
    } catch (ex) {
        // continue regardless of error
    }
    return isMobile
}

export interface ReactFBLoginProps {
    appId: string
    callback(userInfo: ReactFBLoginInfo | ReactFBFailureResponse): void
    onFailure?(response: ReactFBFailureResponse): void

    autoLoad?: boolean
    buttonStyle?: React.CSSProperties
    containerStyle?: React.CSSProperties
    cookie?: boolean
    cssClass?: string
    disableMobileRedirect?: boolean
    fields?: string
    icon?: React.ReactNode
    isDisabled?: boolean
    language?: string
    onClick?(event: React.MouseEvent<HTMLDivElement>): void
    reAuthenticate?: boolean
    redirectUri?: string
    scope?: string
    size?: 'small' | 'medium' | 'metro'
    textButton?: string
    typeButton?: string
    version?: string
    xfbml?: boolean
    isMobile?: boolean
    tag?: Node | React.Component<any>
    returnScopes?: boolean
    state?: string
    authType?: string
    responseType?: string
    render: (props: {
        onClick: (e?: any) => void
        disabled?: boolean
        isProcessing?: boolean
    }) => React.ReactElement
}

export interface ReactFBFailureResponse {
    status: string
}

export interface ReactFBAuthResponse {
    accessToken: string
    userID: string
    expiresIn: number
    signedRequest: string
    graphDomain: string
    data_access_expiration_time: number
}

export interface ReactFBLoginResponse {
    authResponse: ReactFBAuthResponse
    status: string
}

export interface ReactFBLoginInfo {
    id: string
    accessToken: string
    name?: string
    email?: string
    picture?: {
        data: {
            height?: number
            is_silhouette?: boolean
            url?: string
            width?: number
        }
    }
}

let __isMounted: boolean = false

const ReactFBLogin = (props: ReactFBLoginProps) => {
    const [isSdkLoaded, setIsSdkLoaded] = useState<boolean>(false)
    const [isProcessing, setIsProcessing] = useState<boolean>(false)

    useEffect(() => {
        __isMounted = true
        if (document.getElementById('react-fb-login')) {
            setIsSdkLoaded(true)
            return
        }
        setFbAsyncInit()
        loadSdkAsynchronously()
        let fbRoot = document.getElementById('fb-root')
        if (!fbRoot) {
            fbRoot = document.createElement('div')
            fbRoot.id = 'fb-root'
            document.body.appendChild(fbRoot)
        }
    }, [isProcessing])

    useEffect(() => {
        if (isSdkLoaded) {
            __window.FB.getLoginStatus(checkLoginAfterRefresh)
        }
    }, [props.autoLoad])

    useEffect(() => {
        return () => {
            __isMounted = false
        }
    }, [])

    const setFbAsyncInit = () => {
        const { appId, xfbml, cookie, version, autoLoad } = props
        __window.fbAsyncInit = () => {
            __window.FB.init({
                version: `v${version}`,
                appId,
                xfbml,
                cookie,
            })
            __isMounted && setIsSdkLoaded(true)

            if (autoLoad || isRedirectedFromFb()) {
                __window.FB.getLoginStatus(checkLoginAfterRefresh)
            }
        }
    }

    const loadSdkAsynchronously = () => {
        const { language } = props
            ; ((d, s, id) => {
                const element = d.getElementsByTagName(s)[0]
                const fjs: any = element
                let js: any = element
                if (d.getElementById(id)) {
                    return
                }
                js = d.createElement(s)
                js.id = id
                js.src = `https://connect.facebook.net/${language}/sdk.js`
                fjs.parentNode.insertBefore(js, fjs)
            })(document, 'script', 'react-fb-login')
    }

    const isRedirectedFromFb = () => {
        const params = window.location.search
        const res =
            decodeParamForKey(params, 'state') === 'facebookdirect' &&
            (decodeParamForKey(params, 'code') ||
                decodeParamForKey(params, 'granted_scopes'))

        return res
    }

    const checkLoginAfterRefresh = (response: ReactFBLoginResponse) => {
        if (response.status === 'connected') {
            checkLoginState(response)
        } else {
            __window.FB.login(
                (loginResponse: ReactFBLoginResponse) =>
                    checkLoginState(loginResponse),
                true,
            )
        }
    }

    const checkLoginState = (response: ReactFBLoginResponse) => {
        __isMounted && setIsProcessing(false)
        if (response.authResponse) {
            responseApi(response.authResponse)
        } else {
            if (props.onFailure) {
                props.onFailure({ status: response.status })
            } else {
                props.callback({ status: response.status })
            }
        }
    }

    const responseApi = (authResponse: ReactFBAuthResponse) => {
        __window.FB.api(
            '/me',
            { locale: props.language, fields: props.fields },
            (me: ReactFBLoginInfo) => {
                Object.assign(me, authResponse)
                props.callback(me)
            },
        )
    }

    const decodeParamForKey = (paramString: string, key: string) => {
        return decodeURIComponent(
            paramString.replace(
                new RegExp(
                    '^(?:.*[&\\?]' +
                    encodeURIComponent(key).replace(/[\.\+\*]/g, '\\$&') +
                    '(?:\\=([^&]*))?)?.*$',
                    'i',
                ),
                '$1',
            ),
        )
    }

    const getParamsFromObject = (params: any) =>
        '?' +
        Object.keys(params)
            .map(param => `${param}=${encodeURIComponent(params[param])}`)
            .join('&')

    const click = (e: any) => {
        if (!isSdkLoaded || isProcessing || props.isDisabled) {
            return
        }
        setIsProcessing(true)
        const {
            scope,
            appId,
            onClick,
            returnScopes,
            responseType,
            redirectUri,
            disableMobileRedirect,
            authType,
            state,
        } = props

        if (typeof onClick === 'function') {
            onClick(e)
            if (e.defaultPrevented) {
                setIsProcessing(false)
                return
            }
        }

        const params = {
            client_id: appId,
            redirect_uri: redirectUri,
            state,
            return_scopes: returnScopes,
            scope,
            response_type: responseType,
            auth_type: authType,
        }

        if (props.isMobile && !disableMobileRedirect) {
            window.location.href = `https://www.facebook.com/dialog/oauth${getParamsFromObject(
                params,
            )}`
        } else {
            if (!__window.FB) {
                if (props.onFailure) {
                    props.onFailure({ status: 'facebookNotLoaded' })
                }
                return
            }
            __window.FB.getLoginStatus((response: ReactFBLoginResponse) => {
                if (response.status === 'connected') {
                    checkLoginState(response)
                } else {
                    __window.FB.login(checkLoginState, {
                        scope,
                        return_scopes: returnScopes,
                        auth_type: params.auth_type,
                    })
                }
            })
        }
    }

    return props.render({
        onClick: click,
        disabled: !isSdkLoaded,
        isProcessing: isProcessing,
    })
}

ReactFBLogin.defaultProps = {
    redirectUri: typeof window !== 'undefined' ? window.location.href : '/',
    scope: 'public_profile,email',
    returnScopes: false,
    xfbml: false,
    cookie: false,
    authType: '',
    fields: 'name',
    version: '6.0',
    language: 'en_US',
    disableMobileRedirect: false,
    isMobile: getIsMobile(),
    onFailure: null,
    state: 'facebookdirect',
    responseType: 'code',
    autoLoad: false,
}

export default ReactFBLogin
