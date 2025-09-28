import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    lecturer: {
        type: String,
    },
    saa: {
        type: String,
    },
    venue: {
        type: String,
        
    },
    unit: {
        type: String,
    },
    detail: {
        type: String,
    },
});

const Notification = mongoose.models.notification || mongoose.model("notification", notificationSchema);

export default Notification;
