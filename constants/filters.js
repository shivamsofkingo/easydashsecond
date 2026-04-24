const baseQuery = {
    isSold: false,
    isDeleted: false,
    ...(req.blockedUserIds?.length > 0 && {
        userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) }
    }),
};

const locationfilter = {
    category,
    "location.coordinates": {
        $geoWithin: {
            $centerSphere: [userLocation, maxDistanceInRadians],
        },
    },
    isSold: false,
    ...(req.blockedUserIds?.length > 0 && {
        userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) }
    }),
};
