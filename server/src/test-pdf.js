const { generateCertificatePDF } = require('./utils/certificateGen');

(async () => {
    try {
        const buffer = await generateCertificatePDF({
            volunteerName: "Test User",
            eventTitle: "Test Event",
            eventDate: new Date(),
            eventLocation: "Test Location",
            issuedAt: new Date(),
            certId: "12345"
        });
        console.log("PDF generated! Size:", buffer.length);
    } catch (err) {
        console.error("PDF generation failed:", err);
        process.exit(1);
    }
})();
