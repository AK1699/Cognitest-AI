import React from 'react'

export const MqttIcon = ({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
        src="/MQTT.svg"
        alt="MQTT"
        className={className}
        {...props}
    />
)
