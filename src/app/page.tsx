'use client';

import Link from 'next/link';
import {
  Mail,
  Upload,
  Clock,
  Send,
  FileText,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Users,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Upload,
    title: 'Easy Excel Upload',
    description: 'Simply upload your Excel or CSV file with email addresses and any custom fields you need.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FileText,
    title: 'Beautiful Templates',
    description: 'Choose from pre-built templates or create your own with personalized variables like {{name}}.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Clock,
    title: 'Timed Sending',
    description: 'Emails are sent one by one at configurable intervals to avoid spam filters.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: BarChart3,
    title: 'Track Progress',
    description: 'Monitor your campaign in real-time with detailed statistics and history.',
    gradient: 'from-green-500 to-emerald-500',
  },
];

const steps = [
  {
    number: '01',
    title: 'Connect Gmail',
    description: 'Link your Gmail account securely with OAuth authentication.',
  },
  {
    number: '02',
    title: 'Upload Contacts',
    description: 'Import your Excel file with email addresses and personalization data.',
  },
  {
    number: '03',
    title: 'Choose Template',
    description: 'Select or create an email template with custom variables.',
  },
  {
    number: '04',
    title: 'Start Campaign',
    description: 'Launch your campaign and watch emails go out automatically.',
  },
];

const benefits = [
  { icon: Zap, text: 'Lightning fast setup' },
  { icon: Shield, text: 'Secure OAuth authentication' },
  { icon: Users, text: 'Multiple Gmail accounts' },
  { icon: Sparkles, text: 'Variable personalization' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Email Campaign
              </span>
            </div>
            <Link href="/dashboard">
              <Button>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-100 mb-8">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Simple & Powerful Email Campaigns</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
              <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
                Send Personalized
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Bulk Emails
              </span>
              <br />
              <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
                With Ease
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload your Excel file, choose a template, and let the system send emails
              one by one at your preferred interval. No more manual sending!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-6">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Benefits Pills */}
            <div className="flex flex-wrap justify-center gap-4 mt-12">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100"
                >
                  <benefit.icon className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-slate-700">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image/Preview */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-1 shadow-2xl shadow-purple-500/20">
              <div className="bg-white rounded-xl p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-4 text-sm text-slate-400">Email Campaign Dashboard</span>
                </div>

                {/* Mock Dashboard Preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {['Accounts', 'Emails Sent', 'Success Rate', 'Active'].map((label, i) => (
                    <div key={i} className={`p-4 rounded-xl text-white ${
                      i === 0 ? 'bg-gradient-to-br from-blue-500 to-purple-600' :
                      i === 1 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                      i === 2 ? 'bg-gradient-to-br from-pink-500 to-rose-600' :
                      'bg-gradient-to-br from-cyan-500 to-blue-600'
                    }`}>
                      <p className="text-sm text-white/80">{label}</p>
                      <p className="text-2xl font-bold mt-1">
                        {i === 0 ? '3' : i === 1 ? '1,247' : i === 2 ? '98.5%' : '2'}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="h-32 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl flex items-center justify-center">
                  <p className="text-slate-400">Campaign Progress Chart</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Everything You Need
              </span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A complete solution for sending personalized email campaigns without the complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Get started in minutes with our simple four-step process.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-purple-200 -translate-x-1/2" />
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold mb-6 shadow-lg shadow-purple-500/20">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-slate-900">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Template Preview Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Personalize Every Email
                </span>
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Use variables like <code className="px-2 py-1 bg-white rounded text-blue-600">{'{{name}}'}</code> and{' '}
                <code className="px-2 py-1 bg-white rounded text-blue-600">{'{{company}}'}</code> to automatically
                personalize each email with data from your Excel file.
              </p>

              <div className="space-y-4">
                {[
                  'Use any column from your Excel as a variable',
                  'Preview emails before sending',
                  '6 beautiful pre-built templates included',
                  'Create and save your own templates',
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>

              <Link href="/dashboard/templates" className="inline-block mt-8">
                <Button size="lg">
                  Browse Templates
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-slate-900">Email Template Preview</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide">Subject</label>
                  <p className="text-slate-900 font-medium mt-1">
                    Hi {'{{name}}'}, Quick question about {'{{company}}'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide">Body</label>
                  <div className="mt-1 p-4 bg-slate-50 rounded-lg text-slate-700 text-sm leading-relaxed">
                    <p>Hi {'{{name}}'},</p>
                    <br />
                    <p>I hope this email finds you well. I noticed you work at {'{{company}}'} and wanted to reach out...</p>
                    <br />
                    <p>Best regards,<br />Your Name</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white shadow-2xl shadow-purple-500/30">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Start Your Campaign?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Connect your Gmail account, upload your contacts, and start sending
              personalized emails in minutes.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-white/90 text-lg px-8 py-6">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-slate-900">Email Campaign</span>
            </div>
            <p className="text-sm text-slate-500">
              Built for simplicity. Designed for results.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
