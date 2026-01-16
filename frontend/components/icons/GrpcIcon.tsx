import React from 'react'

export const GrpcIcon = ({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
        src="/gRPC.svg"
        alt="gRPC"
        className={className}
        {...props}
    />
)
