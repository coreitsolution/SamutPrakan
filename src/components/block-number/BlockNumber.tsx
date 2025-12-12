import React from 'react'

type BlockNumberProps = {
  title: string;
  titleDate: string;
  count: string | undefined;
}

const BlockNumber: React.FC<BlockNumberProps> = ({
  title,
  titleDate,
  count,
}) => {
  const createCountBlock = (count: string) => {
    const formatted = Number(count).toLocaleString();

    const digitItems: { char: string; hasCommaBefore: boolean }[] = [];
    let lastWasComma = false;

    for (const ch of formatted) {
      if (ch === ",") {
        lastWasComma = true;
        continue;
      }
      digitItems.push({ char: ch, hasCommaBefore: lastWasComma });
      lastWasComma = false;
    }

    const totalBlocks = 15;
    const emptyBlocks = totalBlocks - digitItems.length;

    return Array.from({ length: totalBlocks }).map((_, index) => {
      const isValue = index >= emptyBlocks;
      if (!isValue) {
        return (
          <div
            key={`empty-${index}`}
            className="w-[35px] h-[35px] bg-[#D9D9D9] rounded-[5px] mx-[0.5px]"
          ></div>
        );
      }

      const digitIndex = index - emptyBlocks;
      const { char, hasCommaBefore } = digitItems[digitIndex];

      return (
        <React.Fragment key={`digit-${index}`}>
          {hasCommaBefore && (
            <span className="text-[20px] text-[#2B9BED] relative bottom-[-10px]">
              ,
            </span>
          )}

          <div
            className="w-[35px] h-[35px] rounded-[5px] bg-[#2B9BED] text-white text-[20px] flex items-center justify-center animate-flip mx-[0.5px]"
            style={{
              animationDelay: `${(digitIndex + 1) * 100}ms`,
              animationFillMode: "forwards",
            }}
          >
            {char}
          </div>
        </React.Fragment>
      );
    });
  };


  return (
    <div className='flex flex-col py-3 gap-6'>
      <div className='flex items-center justify-between'>
        <p className='font-semibold text-[20px] text-[#1A6DDF]'>{title}</p>
        <div className='px-2 py-1 bg-[#1A6DDF] rounded-[5px]'>
          <p className='text-[12px]'>{titleDate}</p>
        </div>
      </div>
      <div className='py-1'>
        <div className='flex'>{createCountBlock(count ?? "")}</div>
      </div>
    </div>
  )
}

export default BlockNumber