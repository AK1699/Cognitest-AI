'use client'

import Link from 'next/link'
import { ArrowRight, Zap, Brain, FlaskConical, ShieldAlert, Code, Workflow, Bot } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/cognitest.ai" className="flex items-center space-x-3" suppressHydrationWarning>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md bg-primary">
                <FlaskConical className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-semibold text-primary">
                CogniTest
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-900 transition-colors font-normal hover:opacity-80" suppressHydrationWarning>
                Features
              </Link>
              <Link href="#pricing" className="text-gray-900 transition-colors font-normal hover:opacity-80" suppressHydrationWarning>
                Pricing
              </Link>
              <Link href="#docs" className="text-gray-900 transition-colors font-normal hover:opacity-80" suppressHydrationWarning>
                Docs
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <button className="px-8 py-3.5 text-gray-900 font-medium transition-opacity hover:opacity-70 rounded-full">
                  Sign in
                </button>
              </Link>
              <Link href="/auth/signup">
                <button className="px-8 py-3.5 text-white font-medium rounded-full transition-all shadow-md hover:shadow-lg hover:opacity-90 bg-primary">
                  Sign up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full px-6 sm:px-8 lg:px-12 pt-20 pb-16">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-3 rounded-full pl-2 pr-5 py-2 mb-8 bg-gradient-to-r from-emerald-950/90 via-emerald-900/80 to-teal-900/80 border border-emerald-500/30 backdrop-blur-sm shadow-md shadow-emerald-950/30 animate-float hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/40 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>

            {/* Bot Avatar */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/50 group-hover:shadow-emerald-400/60 transition-shadow animate-bounce-slow">
              <Bot className="w-5 h-5 text-white animate-wiggle" />
            </div>

            <span className="text-sm font-semibold text-emerald-300 group-hover:text-emerald-200 transition-colors duration-300">AI-Powered Testing Platform</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-gray-900">Test. Self Evolve. </span>
            <span className="bg-gradient-to-r from-emerald-700 via-teal-600 to-blue-600 bg-clip-text text-transparent">
              Self Heal.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-gray-500 max-w-3xl mx-auto mb-10 leading-relaxed">
            CogniTest is a dynamic, self-evolving testing ecosystem powered by AI. Create
            comprehensive test plans, automate workflows, and ensure quality with intelligent
            agents that learn from your projects.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center space-x-4 flex-wrap gap-4">
            <Link href="/auth/signup">
              <button className="group inline-flex items-center px-10 py-4 text-white text-lg font-medium rounded-full transition-all shadow-lg hover:shadow-xl hover:opacity-90 bg-primary">
                Start Testing Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="#docs" suppressHydrationWarning>
              <button className="inline-flex items-center px-10 py-4 bg-white hover:bg-gray-50 text-gray-900 text-lg font-medium rounded-full border-2 border-gray-300 transition-all">
                View Documentation
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-8 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="text-6xl font-semibold mb-2 text-primary">
              100%
            </div>
            <div className="text-gray-500 font-semibold text-base">Test Coverage</div>
          </div>
          <div className="text-center p-8 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="text-6xl font-semibold mb-2 text-primary">
              10x
            </div>
            <div className="text-gray-500 font-semibold text-base">Faster Testing</div>
          </div>
          <div className="text-center p-8 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="text-6xl font-semibold mb-2 text-primary">
              AI
            </div>
            <div className="text-gray-500 font-semibold text-base">Self-Learning</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full px-6 sm:px-8 lg:px-12 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4">
            Intelligent Testing, Automated
          </h2>
          <p className="text-xl font-normal text-gray-500 max-w-2xl mx-auto">
            AI-powered modules that work together to accelerate your testing workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-accent/10">
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-500 font-normal leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-20">
        <div className="w-full px-6 sm:px-8 lg:px-12 py-12">
          <div className="text-center text-gray-500">
            <p>&copy; 2025 Cognitest. Built with AI for the future of testing.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    title: 'AI Test Management',
    description: 'Automatically generate test plans, suites, and cases from requirements, JIRA tickets, and documentation.',
    icon: Brain,
    color: 'text-blue-600',
  },
  {
    title: 'API Testing Hub',
    description: 'Postman-like interface with AI-powered test generation from OpenAPI specs and intelligent validation.',
    icon: Code,
    color: 'text-green-600',
  },
  {
    title: 'Security Testing',
    description: 'Automated vulnerability scanning with OWASP Top 10 detection and AI-suggested remediation.',
    icon: ShieldAlert,
    color: 'text-red-600',
  },
  {
    title: 'Performance Testing',
    description: 'AI-generated load tests with bottleneck detection and predictive failure analysis.',
    icon: Zap,
    color: 'text-yellow-600',
  },
  {
    title: 'Web Automation',
    description: 'Visual UI builder that generates Playwright scripts. Record, edit, and execute tests seamlessly.',
    icon: FlaskConical,
    color: 'text-purple-600',
  },
  {
    title: 'Workflow Automation',
    description: 'n8n-style visual workflow builder connecting tests, notifications, and integrations.',
    icon: Workflow,
    color: 'text-indigo-600',
  },
]
