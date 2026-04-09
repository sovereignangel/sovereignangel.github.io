import Image from 'next/image'

export default function InputsSection() {
  return (
    <section className="bg-[#faf8f4]/90 backdrop-blur-sm rounded-sm p-5 -mx-5">
      <div>
          <div className="mb-7">
            <h3 className="text-[17px] font-medium mb-1">
              <a
                href="https://online.stanford.edu/courses/xcs224r-deep-reinforcement-learning"
                className="text-[#1a1a1a] no-underline border-b border-[#ccc] hover:border-[#1a1a1a] transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                Stanford CS224R — Deep Reinforcement Learning
              </a>
            </h3>
            <p className="text-[13px] text-[#888] mb-2">In Progress</p>
          </div>

          <div className="mb-7">
            <h3 className="text-[17px] font-medium mb-1">
              <a
                href="https://introtodeeplearning.com/"
                className="text-[#1a1a1a] no-underline border-b border-[#ccc] hover:border-[#1a1a1a] transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                MIT 6.S191 — Deep Learning
              </a>
            </h3>
            <p className="text-[13px] text-[#888] mb-2">
              2nd Place, Final Project Competition · Jan 9, 2026
            </p>
            <p className="text-[#555] text-[15px] mb-4">
              Built a proof-of-concept demonstrating the feasibility of decoding dreams from fMRI data using deep learning and Stable Diffusion.
            </p>
            <div className="flex gap-3 mt-4">
              {['MITDL0.jpg', 'MITDL3.jpg', 'MITDL4.jpg'].map((src) => (
                <Image
                  key={src}
                  src={`/${src}`}
                  alt="MIT Deep Learning"
                  width={200}
                  height={140}
                  className="w-[calc(33.333%-8px)] h-[140px] object-cover rounded grayscale-[10%]"
                />
              ))}
            </div>
          </div>
        </div>
    </section>
  )
}
