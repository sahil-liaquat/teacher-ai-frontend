import { cn } from "@/lib/utils";

export function DashboardBannerHeader({
  titleTop,
  titleHighlight,
  titleSuffix,
  imageSrc,
  className,
  imageClassName
}: {
  titleTop: string;
  titleHighlight: string;
  titleSuffix?: string;
  imageSrc?: string;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <header
      className={cn(
        "reveal-card relative min-h-[190px] overflow-hidden rounded-[24px] border border-[#d9e5f3] bg-[linear-gradient(120deg,#ffffff_0%,#ffffff_58%,#f4f9ff_100%)] px-5 py-5 shadow-[0_16px_40px_rgba(37,99,235,0.07)] sm:min-h-[214px] sm:px-8 lg:min-h-[232px] lg:px-12",
        className
      )}
    >
      <div className="relative z-10 flex min-h-[150px] flex-col justify-center sm:min-h-[174px] lg:min-h-[190px]">
        <div className="max-w-[620px] pr-0 lg:pr-[260px]">
          <h1 className="text-[32px] font-black leading-[1.1] tracking-normal text-[#071b49] min-[390px]:text-[36px] sm:text-[46px] lg:text-[52px]">
            <span className="block">{titleTop}</span>
            <span className="block sm:whitespace-nowrap">
              <span className="text-[#126de8]">{titleHighlight}</span>
              {titleSuffix ? ` ${titleSuffix}` : ""}
            </span>
          </h1>
        </div>
      </div>

      {imageSrc ? (
        <div className="pointer-events-none absolute bottom-0 -right-6 hidden h-[245px] w-[54%] max-w-[620px] lg:block xl:-right-2">
          <img
            src={imageSrc}
            alt=""
            aria-hidden="true"
            className={cn("h-full w-full object-contain object-bottom drop-shadow-[0_24px_34px_rgba(40,78,130,0.12)]", imageClassName)}
          />
        </div>
      ) : null}

      <div className="pointer-events-none absolute left-[55%] top-[70px] hidden h-1.5 w-1.5 rounded-full bg-[#93a7c5] opacity-70 lg:block" />
      <div className="pointer-events-none absolute left-[58%] top-[102px] hidden text-xl font-black text-[#8bb8f5] lg:block">*</div>
      <div className="pointer-events-none absolute right-[30%] top-[54px] hidden text-2xl font-black text-[#b5c5df] lg:block">*</div>
    </header>
  );
}
