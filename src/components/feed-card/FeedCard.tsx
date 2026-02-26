import { motion } from "framer-motion";

interface FeedCardProps {
  id: string | number;
  index: number;
  children: React.ReactNode;
}

const FeedCard: React.FC<FeedCardProps> = ({ id, index, children }) => (
  <motion.div
    layout="position"
    key={`data_${id}_${index}`}
    className='flex flex-col border border-[#CCD0CF]'
  >
    <div className='grid grid-cols-[55%_45%]'>
      {children}
    </div>
  </motion.div>
);

export default FeedCard;