
async function test() {
    try {
        console.log("Step 1: Generating question...");
        const res1 = await fetch("http://localhost:3000/api/generate-question", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Test User",
                city: "Test City",
                complaint: "Testing the complaint system. There is an issue with the pipes."
            })
        });
        const data1 = await res1.json();
        console.log("Step 1 Result:", data1);

        if (!data1.success) {
            console.error("Step 1 Failed");
            return;
        }

        console.log("Step 2: Submitting final complaint...");
        const res2 = await fetch("http://localhost:3000/api/complaints", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Test User",
                city: "Test City",
                mobile: "9876543210",
                complaint: "Testing the complaint system. There is an issue with the pipes.",
                aiQuestion: data1.question,
                userAnswer: "The pipes are leaking in the basement."
            })
        });
        const data2 = await res2.json();
        console.log("Step 2 Result:", data2);
    } catch (err) {
        console.error("Test Error:", err);
    }
}

test();
