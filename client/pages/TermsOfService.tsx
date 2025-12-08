import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Calculator, ArrowLeft } from "lucide-react";

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Calculator className="h-8 w-8 text-orange-600" />
            <h1 className="text-2xl font-bold text-slate-900">ThermoNeural</h1>
          </Link>
          <Link to="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Terms of Service
        </h1>
        <p className="text-gray-600 mb-8">Last updated: December 2024</p>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Agreement to Terms
            </h2>
            <p className="text-gray-700">
              By accessing and using the ThermoNeural website and services
              ("Services"), you accept and agree to be bound by the terms and
              provision of this agreement. If you do not agree to abide by the
              above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Use License
            </h2>
            <p className="text-gray-700 mb-4">
              Permission is granted to temporarily download one copy of the
              materials (information or software) on ThermoNeural's website for
              personal, non-commercial transitory viewing only. This is the
              grant of a license, not a transfer of title, and under this
              license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Modify or copy the materials</li>
              <li>
                Use the materials for any commercial purpose or for any public
                display
              </li>
              <li>Attempt to decompile or reverse engineer any software</li>
              <li>
                Transfer the materials to another person or "mirror" the
                materials on any other server
              </li>
              <li>
                Attempt to gain unauthorized access to any portion of the
                Services
              </li>
              <li>Harass or cause distress or inconvenience to any person</li>
              <li>Transmit obscene or offensive content</li>
              <li>Disrupt the normal flow of dialogue within our website</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Disclaimer
            </h2>
            <p className="text-gray-700 mb-4">
              The materials on ThermoNeural's website are provided on an "as-is"
              basis. ThermoNeural makes no warranties, expressed or implied, and
              hereby disclaims and negates all other warranties including,
              without limitation, implied warranties or conditions of
              merchantability, fitness for a particular purpose, or
              non-infringement of intellectual property or other violation of
              rights.
            </p>
            <p className="text-gray-700">
              While we strive to provide accurate refrigeration calculations,
              ThermoNeural does not warrant the accuracy or completeness of the
              calculations or recommendations provided.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Limitations
            </h2>
            <p className="text-gray-700">
              In no event shall ThermoNeural or its suppliers be liable for
              damages (including, without limitation, damages for loss of data
              or profit, or due to business interruption) arising out of the use
              or inability to use the materials on ThermoNeural's website, even if
              ThermoNeural or an authorized representative has been notified
              orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Accuracy of Materials
            </h2>
            <p className="text-gray-700">
              The materials appearing on ThermoNeural's website could include
              technical, typographical, or photographic errors. ThermoNeural does
              not warrant that any of the materials on its website are accurate,
              complete, or current. ThermoNeural may make changes to the materials
              contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Links</h2>
            <p className="text-gray-700">
              ThermoNeural has not reviewed all of the sites linked to its website
              and is not responsible for the contents of any such linked site.
              The inclusion of any link does not imply endorsement by ThermoNeural
              of the site. Use of any such linked website is at the user's own
              risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Modifications
            </h2>
            <p className="text-gray-700">
              ThermoNeural may revise these terms of service for its website at
              any time without notice. By using this website, you are agreeing
              to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Governing Law
            </h2>
            <p className="text-gray-700">
              These terms and conditions are governed by and construed in
              accordance with the laws of the United States and the State of
              California, and you irrevocably submit to the exclusive
              jurisdiction of the courts in that location.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. User Accounts
            </h2>
            <p className="text-gray-700 mb-4">
              If you create an account on ThermoNeural, you are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>
                Maintaining the confidentiality of your account credentials
              </li>
              <li>All activities that occur under your account</li>
              <li>Notifying us of any unauthorized use of your account</li>
              <li>
                Using the Services in compliance with all applicable laws and
                regulations
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Acceptable Use
            </h2>
            <p className="text-gray-700 mb-4">
              You agree not to use the Services in any way that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Violates any applicable law or regulation</li>
              <li>Infringes on intellectual property rights</li>
              <li>Is fraudulent, deceptive, or misleading</li>
              <li>Impersonates another person or entity</li>
              <li>Disrupts the normal functioning of the Services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Intellectual Property
            </h2>
            <p className="text-gray-700">
              All content, including software, text, graphics, images, and logos
              on ThermoNeural's website are the property of ThermoNeural or its
              content suppliers and protected by international copyright and
              other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              12. Limitation of Liability
            </h2>
            <p className="text-gray-700">
              TO THE FULLEST EXTENT PERMITTED BY LAW, SIMULATEON SHALL NOT BE
              LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
              PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
              INCURRED DIRECTLY OR INDIRECTLY.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              13. Termination
            </h2>
            <p className="text-gray-700">
              ThermoNeural may terminate or suspend your account and access to the
              Services at any time, without notice, for conduct that it believes
              violates these Terms or is harmful to other users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              14. Refund Policy
            </h2>
            <p className="text-gray-700">
              We offer a 30-day money-back guarantee on all paid plans. If you
              are not satisfied with our Services, contact us within 30 days of
              purchase for a full refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              15. Contact Information
            </h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms of Service, please
              contact us:
            </p>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Email:</strong> <a href="mailto:support@thermoneural.com" className="text-blue-600 hover:underline">support@thermoneural.com</a>
              </p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
