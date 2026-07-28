'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SectionHeading } from '@/components/sections/section-heading';
import { Reveal } from '@/components/ui/reveal';
import { homepageFaqs } from '@/lib/seo-content';

export function FaqSection() {
  return (
    <section className="px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="FAQ"
          title="Lofi Radio 常见问题"
          description="把使用时最容易遇到的几个问题整理在这里，既方便第一次打开网站时快速了解，也能帮你更快找到适合自己的收听方式和使用场景。"
          className="mb-8 sm:mb-10"
        />

        <Reveal>
          <div className="panel overflow-hidden rounded-[28px] p-3 sm:p-4">
            <Accordion type="single" collapsible className="w-full">
              {homepageFaqs.map((faq, index) => (
                <AccordionItem
                  key={faq.question}
                  value={`faq-${index}`}
                  className="mb-2 rounded-[22px] border border-hairline bg-surface-2/60 px-4 transition-colors last:mb-0 hover:bg-surface-2 data-[state=open]:bg-surface-2 sm:px-6"
                >
                  <AccordionTrigger className="min-h-12 gap-0.5 py-4 text-sm font-semibold text-fg no-underline hover:no-underline sm:gap-4 sm:py-5 sm:text-base [&>svg]:size-3 [&>svg]:shrink-0">
                    <span className="leading-6">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="max-w-none pr-2 pb-4 text-justify text-sm leading-7 text-fg-muted sm:pr-10 sm:pb-6 sm:text-[15px] sm:leading-8">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
