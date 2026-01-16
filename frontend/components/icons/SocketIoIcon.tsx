import React from 'react'

export const SocketIoIcon = ({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
        src="/socket.io.svg"
        alt="Socket.IO"
        className={className}
        {...props}
    />
)
