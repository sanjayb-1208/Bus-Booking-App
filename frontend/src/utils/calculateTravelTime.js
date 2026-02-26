import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

const calculateTravelTime = (departure, arrival) => {
    if (!departure || !arrival) return "0h 0m";

    const start = dayjs(departure);
    const end = dayjs(arrival);

    // Calculate difference in minutes
    const diffInMinutes = end.diff(start, 'minute');

    if (diffInMinutes <= 0) return "Invalid duration";

    const hours = Math.floor(diffInMinutes / 60);
    const mins = diffInMinutes % 60;

    // Check if the arrival is on a different day
    
    return `${hours} Hours`;
};

export default calculateTravelTime;