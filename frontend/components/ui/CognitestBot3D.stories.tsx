/**
 * CognitestBot3D Component Stories
 *
 * Showcase and documentation for the 3D animated Cognitest-inspired bot logo.
 * Demonstrates different sizes, states, and customization options.
 */

import React from 'react';
import CognitestBot3D from './CognitestBot3D';

export default function CognitestBot3DShowcase() {
  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        CognitestBot3D Component
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        A beautiful 3D animated logo inspired by Cognitest with glossy sphere effect,
        realistic lighting, and playful animations.
      </p>

      {/* Size Variations */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Size Variations
        </h2>
        <div className="flex items-center gap-8 p-6 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <CognitestBot3D size={40} />
            <span className="text-xs text-gray-600 dark:text-gray-400">40px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CognitestBot3D size={50} />
            <span className="text-xs text-gray-600 dark:text-gray-400">50px (default)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CognitestBot3D size={60} />
            <span className="text-xs text-gray-600 dark:text-gray-400">60px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CognitestBot3D size={80} />
            <span className="text-xs text-gray-600 dark:text-gray-400">80px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CognitestBot3D size={100} />
            <span className="text-xs text-gray-600 dark:text-gray-400">100px</span>
          </div>
        </div>
      </div>

      {/* Animation States */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Animation States
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              With Animation (default)
            </h3>
            <div className="flex justify-center">
              <CognitestBot3D size={60} animate={true} />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-4 text-center">
              Floating, blinking, wobbling
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Static (no animation)
            </h3>
            <div className="flex justify-center">
              <CognitestBot3D size={60} animate={false} />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-4 text-center">
              Pulse on hover only
            </p>
          </div>
        </div>
      </div>

      {/* Navbar Usage */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Navbar Usage
        </h2>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-700 rounded">
            <CognitestBot3D size={48} />
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">CogniTest</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                AI-Powered Testing
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
            Perfect for navbar branding (40-60px recommended)
          </p>
        </div>
      </div>

      {/* Features List */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Features
        </h2>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">✓</span>
            <span>
              <strong>Glossy 3D Sphere:</strong> Realistic lighting with highlights
              and shadows for depth
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">✓</span>
            <span>
              <strong>Cute White Eyes:</strong> Minimalistic oval eyes with blinking
              animation
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">✓</span>
            <span>
              <strong>Smooth Animations:</strong> Floating, blinking, wobbling, and
              pulse effects
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">✓</span>
            <span>
              <strong>Responsive:</strong> Scales perfectly from 40px to 200px+
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">✓</span>
            <span>
              <strong>Lightweight:</strong> Pure SVG with CSS animations (no
              dependencies)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">✓</span>
            <span>
              <strong>Production-Ready:</strong> Fully typed TypeScript with
              comprehensive comments
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">✓</span>
            <span>
              <strong>Dark Mode:</strong> Works perfectly in light and dark
              themes
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">✓</span>
            <span>
              <strong>Customizable:</strong> Size and animation control via props
            </span>
          </li>
        </ul>
      </div>

      {/* Code Examples */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Usage Examples
        </h2>
        <div className="space-y-4">
          {/* Example 1 */}
          <div className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto">
            <p className="text-xs text-gray-500 mb-2">Basic usage:</p>
            <pre className="text-sm">{`import CognitestBot3D from '@/components/ui/CognitestBot3D';

export default function Navbar() {
  return (
    <nav className="flex items-center gap-2">
      <CognitestBot3D size={50} />
      <span className="font-bold">CogniTest</span>
    </nav>
  );
}`}</pre>
          </div>

          {/* Example 2 */}
          <div className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto">
            <p className="text-xs text-gray-500 mb-2">With custom styling:</p>
            <pre className="text-sm">{`<CognitestBot3D
  size={60}
  animate={true}
  className="hover:drop-shadow-lg transition-all"
/>`}</pre>
          </div>

          {/* Example 3 */}
          <div className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto">
            <p className="text-xs text-gray-500 mb-2">Static variant:</p>
            <pre className="text-sm">{`<CognitestBot3D size={48} animate={false} />`}</pre>
          </div>
        </div>
      </div>

      {/* Props Table */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Component Props
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-200 dark:bg-gray-700">
              <tr>
                <th className="border border-gray-300 dark:border-gray-600 p-3 text-left">
                  Prop
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-3 text-left">
                  Type
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-3 text-left">
                  Default
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-3 text-left">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="border border-gray-300 dark:border-gray-600 p-3">
                  <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                    size
                  </code>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3">
                  <code className="text-blue-600">number</code>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3">
                  <code>50</code>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3">
                  Size in pixels (40-60px recommended)
                </td>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800">
                <td className="border border-gray-300 dark:border-gray-600 p-3">
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    className
                  </code>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3">
                  <code className="text-blue-600">string</code>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3">
                  <code>''</code>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3">
                  Additional CSS classes
                </td>
              </tr>
              <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="border border-gray-300 dark:border-gray-600 p-3">
                  <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                    animate
                  </code>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3">
                  <code className="text-blue-600">boolean</code>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3">
                  <code>true</code>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3">
                  Enable floating and blinking animations
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
