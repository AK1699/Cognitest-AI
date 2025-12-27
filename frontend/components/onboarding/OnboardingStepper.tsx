'use client'

import React from 'react'
import { ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
    id: number
    label: string
}

const steps: Step[] = [
    { id: 1, label: 'Create Account' },
    { id: 2, label: 'Organization' },
    { id: 3, label: 'Invite Team' },
]

interface OnboardingStepperProps {
    currentStep: number
}

export function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
    return (
        <div className="w-full py-8">
            <div className="max-w-xl mx-auto px-4">
                {/* Journey Tag */}
                <div className="flex justify-center mb-4">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-bold tracking-wider uppercase">
                        Step {currentStep} of {steps.length}: Journey
                    </div>
                </div>

                {/* Stepper Logic */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                    {steps.map((step, index) => {
                        const isCompleted = currentStep > step.id
                        const isActive = currentStep === step.id
                        const isLast = index === steps.length - 1

                        return (
                            <React.Fragment key={step.id}>
                                <div className="flex items-center gap-2">
                                    <div
                                        className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                                            isCompleted
                                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                                : isActive
                                                    ? "bg-primary text-white ring-4 ring-primary/20 shadow-lg scale-110"
                                                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                        )}
                                    >
                                        {isCompleted ? (
                                            <Check className="w-4 h-4 stroke-[3px]" />
                                        ) : (
                                            step.id
                                        )}
                                    </div>
                                    <span
                                        className={cn(
                                            "text-sm font-medium transition-colors duration-300 whitespace-nowrap",
                                            isActive
                                                ? "text-gray-900 dark:text-white"
                                                : isCompleted
                                                    ? "text-primary/80 dark:text-primary/60"
                                                    : "text-gray-400 dark:text-gray-500"
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                                {!isLast && (
                                    <ChevronRight
                                        className={cn(
                                            "w-4 h-4 transition-colors duration-300",
                                            isCompleted ? "text-primary/50" : "text-gray-300 dark:text-gray-600"
                                        )}
                                    />
                                )}
                            </React.Fragment>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
