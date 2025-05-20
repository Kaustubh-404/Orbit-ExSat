



import { Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReadContract } from "wagmi";
import { abi } from "@/abi/abi";

interface Market {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  endTime: number;
  outcome: number;
  totalOptionAShares: number;
  totalOptionBShares: number;
  totalPool: number;
  resolved: boolean;
  image?: string;
}

const useMarket = (marketId: number) => {
  return useReadContract({
    address: import.meta.env.VITE_PREDICTION_CONTRACT_ADDRESS as `0x${string}`,
    abi: abi,
    functionName: "getMarketInfo",
    args: [BigInt(marketId)],
  });
};

const useMarkets = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const market1 = useMarket(1);
  const market2 = useMarket(2);
  const market3 = useMarket(3);
  const market4 = useMarket(4);
  const market5 = useMarket(5);

  useEffect(() => {
    if (
      market1.isLoading ||
      market2.isLoading ||
      market3.isLoading ||
      market4.isLoading ||
      market5.isLoading
    ) {
      return;
    }

    setIsLoading(true);
    const marketResults = [
      { result: market1, id: 1 },
      { result: market2, id: 2 },
      { result: market3, id: 3 },
      { result: market4, id: 4 },
      { result: market5, id: 5 },
    ];
    const newMarkets: Market[] = [];

    marketResults.forEach(({ result, id }) => {
      if (result.data && result.data[0] !== "") {
        const [
          question,
          optionA,
          optionB,
          endTime,
          outcome,
          totalOptionAShares,
          totalOptionBShares,
          resolved,
        ] = result.data as [
          string,
          string,
          string,
          bigint,
          number,
          bigint,
          bigint,
          boolean
        ];

        const totalOptionA = Number(totalOptionAShares);
        const totalOptionB = Number(totalOptionBShares);

        newMarkets.push({
          id,
          question,
          optionA,
          optionB,
          endTime: Number(endTime),
          outcome: Number(outcome),
          totalOptionAShares: totalOptionA,
          totalOptionBShares: totalOptionB,
          totalPool: totalOptionA + totalOptionB,
          resolved,
          image: "cards.jpeg",
        });
      }
    });

    console.log("Processed Markets:", newMarkets); // Debugging output

    if (newMarkets.length > 0) {
      setMarkets(newMarkets.sort((a, b) => a.id - b.id));
    } else {
      setError("No valid markets available");
    }

    setIsLoading(false);
  }, [
    market1.data,
    market2.data,
    market3.data,
    market4.data,
    market5.data,
    market1.isError,
    market2.isError,
    market3.isError,
    market4.isError,
    market5.isError,
  ]);

  return { markets, isLoading, error };
};

const SwipeableCard = ({ market, onSwipe }: { market: Market; onSwipe: (direction: "left" | "right") => void }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const yesOpacity = useTransform(x, [-200, 0, 100], [0, 0, 1]);
  const noOpacity = useTransform(x, [-100, 0, 200], [1, 0, 0]);
  const controls = useAnimation();

  const handleDragEnd = async (_: never, info: PanInfo) => {
    const swipeThreshold = 100;

    if (Math.abs(info.offset.x) > swipeThreshold) {
      await controls.start({
        x: info.offset.x > 0 ? 1000 : -1000,
        transition: { duration: 0.3 },
      });

      onSwipe(info.offset.x > 0 ? "right" : "left");

      x.set(0);
      controls.set({ x: 0 });
    } else {
      controls.start({ x: 0, transition: { type: "spring", duration: 0.5 } });
    }
  };

  return (
    <motion.div
      className="absolute w-full"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      animate={controls}
    >
      <div className="relative border-black border-4 rounded-2xl">
        <motion.div className="absolute top-8 right-8 bg-[#99ff88] p-4 rounded-full border-2 border-black" style={{ opacity: yesOpacity }}>
          <Check color="black" size={40} />
        </motion.div>

        <motion.div className="absolute top-8 left-8 bg-[#ff6961] p-4 rounded-full border-2 border-black" style={{ opacity: noOpacity }}>
          <X color="white" size={40} />
        </motion.div>

        <img src="cards.jpeg" alt="market" className="w-full h-[70vh] object-cover rounded-xl select-none" draggable="false" />

        <div className="absolute bottom-14 left-4 flex flex-col gap-4 text-white">
          <h2 className="text-2xl font-bold">{market.question}</h2>
          <p>{market.optionA} VS {market.optionB}</p>
          <Progress value={(market.totalOptionAShares / market.totalPool) * 100} />
          <p>{((market.totalOptionAShares / market.totalPool) * 100).toFixed(1)}% Chance</p>
        </div>
      </div>
    </motion.div>
  );
};

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const { markets, isLoading, error } = useMarkets();

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "right" && markets[currentIndex]) {
      navigate(`/bet/${markets[currentIndex].id}`);
    }
    setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, markets.length - 1));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen text-xl">Loading markets...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-xl text-red-500">Error: {error}</div>;
  }

  if (!markets.length) {
    return <div className="flex items-center justify-center h-screen text-xl">No markets available</div>;
  }

  return (
    <div className="px-4 pb-14">
      <div className="relative h-[70vh]">
        {markets.map((market, index) => index === currentIndex && <SwipeableCard key={market.id} market={market} onSwipe={handleSwipe} />)}
      </div>
      <div className="mt-10 text-center text-gray-500">{currentIndex + 1} of {markets.length} markets</div>
    </div>
  );
}

