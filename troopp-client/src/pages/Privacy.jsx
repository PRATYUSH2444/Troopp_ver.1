import React from 'react'

const Privacy = () => {
  return (
    <div className="min-h-screen bg-stone-50 px-6 py-12 flex justify-center items-center">
      <div className="w-full max-w-2xl bg-white border border-stone-200 rounded-3xl p-8 shadow-xl flex flex-col gap-6">
        <h2 className="font-heading font-black text-3xl text-stone-905 tracking-tight">
          Privacy Policy
        </h2>
        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider -mt-4">
          Last Updated: July 2026
        </span>

        <div className="text-xs text-stone-600 flex flex-col gap-4 leading-relaxed overflow-y-auto max-h-[50vh] pr-2">
          <p>
            At Troopp, your privacy and physical safety are our highest priorities. This policy describes how we secure and delete your identity documents.
          </p>

          <h3 className="font-bold text-stone-850">1. Data Encryption Guidelines</h3>
          <p>
            All submitted government ID credentials (names, DOBs, document numbers) are immediately encrypted using AES-256-CBC cipher metrics before being saved to the database. Decryption keys are managed strictly by hardware security modules.
          </p>

          <h3 className="font-bold text-stone-850">2. Upload Retention & Automatic Purging</h3>
          <p>
            We collect ID files solely for gateway comparison checks. To protect your privacy, raw ID document files are automatically purged from Cloudinary storage folders 30 days post-verification.
          </p>

          <h3 className="font-bold text-stone-850">3. Information Security</h3>
          <p>
            We do not share your private verified details, emergency numbers, or physical selfie uploads with third-party marketers. Coordinates tracked for waypoint check-ins are retained only for active trip validation.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Privacy
