import { Actor } from 'apify';

await Actor.init();

try {
    // 1. Get inputs
    const input = await Actor.getInput();
    const { competitorName, country, maxAds } = input;

    if (!competitorName || !country) {
        throw new Error("❌ Missing 'competitorName' or 'country' in input.");
    }

    console.log(`🚀 Starting scrape for: ${competitorName} in ${country}...`);

    // 2. Build the Facebook Ad Library URL
    const searchUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&q=${encodeURIComponent(competitorName)}&search_type=keyword_unordered&media_type=all`;
    
    console.log(`🔎 Generated URL: ${searchUrl}`);

    // 3. Call the sub-scraper (curious_coder)
    console.log("⚡ Calling worker actor (curious_coder)...");
    
    const run = await Actor.call('curious_coder/facebook-ads-library-scraper', {
        urls: [{ url: searchUrl }],
        maxItems: maxAds,
        proxyConfiguration: { useApifyProxy: true }
    });

    console.log(`✅ Worker finished! Fetching results from Dataset: ${run.defaultDatasetId}`);

    // 4. Retrieve data from the worker's dataset
    const dataset = await Actor.openDataset(run.defaultDatasetId);
    const { items } = await dataset.getData();

    if (items.length > 0) {
        // 5. Push data to YOUR actor's storage
        await Actor.pushData(items);
        console.log(`🎉 Successfully saved ${items.length} ads to your dataset.`);
    } else {
        console.log("⚠️ No ads found. Check if the competitor is running ads in this country.");
    }

} catch (error) {
    console.error("❌ Error occurred:", error);
    await Actor.fail(error.message);
}

await Actor.exit();
