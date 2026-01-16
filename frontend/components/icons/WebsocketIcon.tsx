import React from 'react'

export const WebsocketIcon = ({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
        src="/websocket.svg"
        alt="WebSocket"
        className={className}
        {...props}
    />
)
