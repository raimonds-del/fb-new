import { Actor } from 'apify';

await Actor.init();

try {
    // 1. Get inputs
    const input = await Actor.getInput();
    const { competitorName, country, maxAds } = input;

    if (!competitorName || !country) {
        throw new Error("❌ Missing 'competitorName' or 'country' in input.");
    }

    console.log(`🚀 Starting scrape for: ${competitorName} in ${country} (Limit: ${maxAds})...`);

    // 2. Build the Facebook Ad Library URL
    const searchUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&q=${encodeURIComponent(competitorName)}&search_type=keyword_unordered&media_type=all`;
    
    console.log(`🔎 Generated URL: ${searchUrl}`);

    // 3. Call the sub-scraper (curious_coder)
    // FIX: We send the limit in 3 different ways to ensure the actor respects it.
    console.log("⚡ Calling worker actor...");
    
    const run = await Actor.call('curious_coder/facebook-ads-library-scraper', {
        urls: [{ url: searchUrl }],
        
        // --- THE FIX ---
        maxItems: maxAds,        // Standard Apify name
        resultsLimit: maxAds,    // Common variation
        maxPostCount: maxAds,    // Another variation
        // ---------------

        proxyConfiguration: { useApifyProxy: true }
    });

    console.log(`✅ Worker finished! Fetching results from Dataset: ${run.defaultDatasetId}`);

    // 4. Retrieve data (and slice it just in case)
    const dataset = await Actor.openDataset(run.defaultDatasetId);
    const { items } = await dataset.getData();

    // Double-check: If the worker still sent too many, we only save what you asked for.
    // (Note: You still pay for the scrape, but your database stays clean)
    const finalItems = items.slice(0, maxAds);

    if (finalItems.length > 0) {
        await Actor.pushData(finalItems);
        console.log(`🎉 Successfully saved ${finalItems.length} ads to your dataset.`);
    } else {
        console.log("⚠️ No ads found.");
    }

} catch (error) {
    console.error("❌ Error occurred:", error);
    await Actor.fail(error.message);
}

await Actor.exit();
