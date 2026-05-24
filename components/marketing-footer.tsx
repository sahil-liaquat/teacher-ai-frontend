import Image from "next/image";

export function MarketingFooter() {
  return (
    <footer id="resources" className="bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-5 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Image
          src="/assets/teachpad-footer-logo-cropped.png"
          alt="TeachPad"
          width={1261}
          height={252}
          className="h-auto w-full max-w-6xl"
          priority={false}
        />
      </div>
    </footer>
  );
}
