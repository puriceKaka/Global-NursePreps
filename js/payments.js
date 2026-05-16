const gatewayData = {
    mpesa: {
        icon: "M",
        visual: "M-Pesa",
        type: "Mobile money",
        title: "M-Pesa payment workflow",
        description: "Use the M-Pesa option at enrollment, confirm the course name and price, then submit the transaction code for verification and course unlocking.",
        steps: [
            "Register or login with the student account that will own the course.",
            "Select the exact course, licensing track, mock exam, or support service.",
            "Choose M-Pesa, pay from your phone, then save the transaction code.",
            "Access opens only after the selected item is confirmed as paid."
        ]
    },
    card: {
        icon: "V",
        visual: "Visa/Mastercard",
        type: "Card payment",
        title: "Visa and Mastercard payment workflow",
        description: "Card payments are designed for learners paying directly through a secure checkout attached to the selected learning item.",
        steps: [
            "Confirm the course title, price, instructor, and included resources.",
            "Select Visa/Mastercard from the payment options.",
            "Enter card details in the secure gateway screen.",
            "Return to the platform and open the purchased course only."
        ]
    },
    paypal: {
        icon: "P",
        visual: "PayPal",
        type: "International payment",
        title: "PayPal payment workflow",
        description: "PayPal supports international learners who need a global payment route for licensing tracks, exams, and course units.",
        steps: [
            "Choose the selected course or licensing track.",
            "Pick PayPal during checkout.",
            "Approve payment in the PayPal window.",
            "The platform records the reference and unlocks the paid item."
        ]
    },
    bank: {
        icon: "B",
        visual: "Bank Transfer",
        type: "Manual bank confirmation",
        title: "Bank transfer workflow",
        description: "Bank payment is useful for institutional, bulk, or manual course payments that require finance confirmation.",
        steps: [
            "Request the correct bank payment details for the selected item.",
            "Pay the exact amount and keep the receipt or reference.",
            "Submit the reference through support or admin verification.",
            "Access is activated after finance confirmation."
        ]
    },
    airtel: {
        icon: "A",
        visual: "Airtel Money",
        type: "Mobile wallet",
        title: "Airtel Money workflow",
        description: "Airtel Money gives learners another mobile money option for course and support payments where available.",
        steps: [
            "Open enrollment for the selected course or track.",
            "Choose Airtel Money from gateway options.",
            "Complete the payment from your phone.",
            "Save the reference for support or admin confirmation."
        ]
    },
    sponsor: {
        icon: "S",
        visual: "Sponsor",
        type: "Institution or sponsor",
        title: "Institution and sponsor workflow",
        description: "Sponsor payments support universities, hospitals, employers, or scholarship programs paying for learner access.",
        steps: [
            "Confirm the learner list, course bundle, and licensing tracks.",
            "Use invoice, bank, or approved institutional payment.",
            "Admin links the payment to each learner account.",
            "Students receive access only to the sponsored items."
        ]
    }
};

const gatewaySelect = document.getElementById("gatewaySelect");
const gatewayDetail = document.getElementById("gatewayDetail");
const gatewayIcon = document.getElementById("gatewayIcon");
const gatewayVisualTitle = document.getElementById("gatewayVisualTitle");
const gatewayType = document.getElementById("gatewayType");
const gatewayTitle = document.getElementById("gatewayTitle");
const gatewayDescription = document.getElementById("gatewayDescription");
const gatewaySteps = document.getElementById("gatewaySteps");
const paidCourseCount = document.getElementById("paidCourseCount");

function renderGateway(key) {
    const gateway = gatewayData[key] || gatewayData.mpesa;
    gatewayDetail.dataset.gateway = key;
    gatewayIcon.textContent = gateway.icon;
    gatewayVisualTitle.textContent = gateway.visual;
    gatewayType.textContent = gateway.type;
    gatewayTitle.textContent = gateway.title;
    gatewayDescription.textContent = gateway.description;
    gatewaySteps.innerHTML = gateway.steps.map((step) => `<li>${step}</li>`).join("");
}

function countPaidCourses() {
    try {
        const payments = JSON.parse(localStorage.getItem("gnp_payments") || "[]");
        if (!Array.isArray(payments)) return 0;
        return payments.filter((payment) => payment.status === "recorded" || payment.status === "paid" || payment.status === "confirmed").length;
    } catch {
        return 0;
    }
}

gatewaySelect?.addEventListener("change", () => renderGateway(gatewaySelect.value));

document.addEventListener("DOMContentLoaded", () => {
    renderGateway(gatewaySelect?.value || "mpesa");
    if (paidCourseCount) {
        paidCourseCount.textContent = String(countPaidCourses());
    }
});
