import React from 'react'

const Terms = () => {
  return (
    <div className="min-h-screen bg-stone-50 px-6 py-12 flex justify-center items-center">
      <div className="w-full max-w-2xl bg-white border border-stone-200 rounded-3xl p-8 shadow-xl flex flex-col gap-6">
        <h2 className="font-heading font-black text-3xl text-stone-900 tracking-tight">
          Terms of Service
        </h2>
        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider -mt-4">
          Last Updated: July 2026
        </span>

        <div className="text-xs text-stone-600 flex flex-col gap-4 leading-relaxed overflow-y-auto max-h-[50vh] pr-2">
          <p>
            Welcome to Troopp. By establishing an account or using our peer-to-peer travel co-coordination platform, you agree to comply with and be bound by the following safety policies and terms of use.
          </p>

          <h3 className="font-bold text-stone-850">1. Verification and Eligibility</h3>
          <p>
            You must be at least 18 years old to join Troopp. All members requesting join permissions for activities are required to undergo government ID validation and selfie face match comparisons. Providing false credentials will lead to permanent platform bans.
          </p>

          <h3 className="font-bold text-stone-850">2. Reliability and Platform trust</h3>
          <p>
            To maintain safety, reliability scores are adjusted based on attendance records and host reviews. No-show behaviors incur severe score penalties (-20 delta) and low scores will result in automatic restrictions from trip rooms.
          </p>

          <h3 className="font-bold text-stone-850">3. Moderation and Striking Safety</h3>
          <p>
            Troopp enforces a three-strike policy on safety and behavior report violations. Valid reports result in immediate warnings, suspensions, or permanent blacklist restrictions.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Terms
