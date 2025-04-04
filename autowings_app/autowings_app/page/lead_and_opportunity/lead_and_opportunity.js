frappe.pages['lead-and-opportunity'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Lead and Opportunity Dashboard',
        single_column: true
    });

    $(wrapper).html(`
        <style>
            /* General Styles */
            body {
                background-color: #f3f4f6;
                padding: 24px;
                font-family: sans-serif;
            }
            .container {
                margin: 0 auto;
            }
            .section {
                background-color: #ffffff;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                padding: 24px;
                margin-bottom: 32px;
            }
            h2 {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 8px;
                color: #162c2a;
            }
            h3 {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 16px;
                color: #162c2a;
            }
            p {
                margin-bottom: 16px;
            }
            .text-gray {
                color: #6b7280;
            }
            .text-dark {
                color: #162c2a;
            }

            /* Form Styles */
            .form-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 16px;
                padding: 20px 0;
            }
            label {
                display: block;
                font-size: 14px;
                color: #19504b;
                margin-bottom: 4px;
                font-weight: bold;
            }
            input, select, textarea {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                font-size: 14px;
                box-sizing: border-box;
            }
            input[type="text"]::placeholder, textarea::placeholder {
                color: #9ca3af;
            }

            /* Button Styles */
            button {
                padding: 4px 16px;
                font-size: 14px;
                border-radius: 4px;
                cursor: pointer;
            }
            .btn-black {
                background-color: #162c2a;
                color: #ffffff;
            }
            .btn-black:hover {
                background-color: #19504b;
            }
            .btn-green {
                background-color: #16a34a;
                color: #ffffff;
            }
            .btn-green:hover {
                background-color: #15803d;
            }
            .btn-blue {
                background-color: #1e40af;
                color: #ffffff;
            }
            .btn-blue:hover {
                background-color: #1e3a8a;
            }

            /* Flex Utilities */
            .flex {
                display: flex;
            }
            .justify-between {
                justify-content: space-between;
            }
            .items-center {
                align-items: center;
            }
            .gap-2 {
                gap: 8px;
            }

            /* Table Styles */
            .table-container {
                overflow-x: auto;
            }
            table {
                width: 100%;
                border: 1px solid #e5e7eb;
                font-size: 14px;
            }
            thead {
                background-color: #f9fafb;
            }
            th {
                text-align: left;
                padding: 8px 16px;
                border-bottom: 1px solid #e5e7eb;
                color: #162c2a;
            }
            tbody tr:nth-child(even) {
                background-color: #f9fafb;
            }
            tbody tr:hover {
                background-color: #f3f4f6;
            }
            td {
                padding: 8px 16px;
                border-bottom: 1px solid #e5e7eb;
            }
            .badge {
                padding: 2px 8px;
                border-radius: 9999px;
                font-size: 12px;
            }
            .badge-open {
                background-color: #dbeafe;
                color: #1e40af;
            }
            .badge-closed {
                background-color: #dcfce7;
                color: #166534;
            }
            .text-blue {
                color: #19504b;
                cursor: pointer;
            }
            .text-blue:hover {
                text-decoration: underline;
            }

            /* Kanban Styles */
            .kanban-container {
                display: flex;
                gap: 16px;
                overflow-x: auto;
                padding: 16px 0;
            }
            .kanban-column {
                background-color: #f9fafb;
                border-radius: 8px;
                padding: 16px;
                width: 300px;
                min-height: 200px;
            }
            .kanban-column h4 {
                margin-bottom: 16px;
                color: #162c2a;
                font-weight: bold;
            }
            .kanban-card {
                background-color: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 4px;
                padding: 8px;
                margin-bottom: 8px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .kanban-card p {
                margin: 0;
            }

            /* View Toggle */
            .view-toggle {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
            }
            .view-toggle button {
                padding: 4px 12px;
                font-size: 14px;
                border-radius: 4px;
                cursor: pointer;
                border: 1px solid #d1d5db;
                background-color: #ffffff;
            }
            .view-toggle button.active {
                background-color: #162c2a;
                color: #ffffff;
                border-color: #162c2a;
            }

            /* Modal Styles */
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                justify-content: center;
                align-items: center;
            }
            .modal-content {
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
            }
            .modal-header {
                font-size: 18px;
                font-weight: bold;
                color: #162c2a;
                margin-bottom: 16px;
            }
            .modal-body {
                margin-bottom: 16px;
            }
            .modal-footer {
                display: flex;
                gap: 8px;
                justify-content: flex-end;
            }
        </style>

        <div class="container">
            <!-- Leads Section -->
            <div class="section">
                <div class="flex justify-between items-center" style="margin-bottom: 16px;">
                    <h2>Leads</h2>
                    <div class="flex gap-2">
                        <div class="view-toggle">
                            <button id="lead_list_view" class="active">List View</button>
                            <button id="lead_kanban_view">Kanban View</button>
                        </div>
                        <button id="create_lead" class="btn-black">Create New Lead</button>
                    </div>
                </div>
                <div id="lead_list_container" class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="lead_table"></tbody>
                    </table>
                </div>
                <div id="lead_kanban_container" class="kanban-container" style="display: none;"></div>
            </div>

            <!-- Opportunities Section -->
            <div class="section">
                <div class="flex justify-between items-center" style="margin-bottom: 16px;">
                    <h2>Opportunities</h2>
                    <div class="view-toggle">
                        <button id="opportunity_list_view" class="active">List View</button>
                        <button id="opportunity_kanban_view">Kanban View</button>
                    </div>
                </div>
                <div id="opportunity_list_container" class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Customer Name</th>
                                <th>Status</th>
                                <th>Opportunity Owner</th>
                                <th>Created By</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="opportunity_table"></tbody>
                    </table>
                </div>
                <div id="opportunity_kanban_container" class="kanban-container" style="display: none;"></div>
            </div>

            <!-- Create Lead Modal -->
            <div id="create_lead_modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">New Lead</div>
                    <div class="modal-body">
                        <div class="form-grid">
                            <div>
                                <label>First Name *</label>
                                <input type="text" id="lead_first_name" placeholder="First Name">
                            </div>
                            <div>
                                <label>Middle Name</label>
                                <input type="text" id="lead_middle_name" placeholder="Middle Name">
                            </div>
                            <div>
                                <label>Last Name</label>
                                <input type="text" id="lead_last_name" placeholder="Last Name">
                            </div>
                            <div>
                                <label>Gender</label>
                                <select id="lead_gender">
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label>Source</label>
                                <select id="lead_source">
                                    <option value="">Select Source</option>
                                    <option value="Website">Website</option>
                                    <option value="Campaign">Campaign</option>
                                    <option value="Referral">Referral</option>
                                </select>
                            </div>
                            <div>
                                <label>Status *</label>
                                <select id="lead_status">
                                    <option value="Lead">Lead</option>
                                    <option value="Open">Open</option>
                                    <option value="Replied">Replied</option>
                                    <option value="Opportunity">Opportunity</option>
                                    <option value="Quotation">Quotation</option>
                                    <option value="Lost Quotation">Lost Quotation</option>
                                    <option value="Interested">Interested</option>
                                    <option value="Converted">Converted</option>
                                    <option value="Do Not Contact">Do Not Contact</option>
                                </select>
                            </div>
                            <div>
                                <label>Email</label>
                                <input type="email" id="lead_email" placeholder="Email">
                            </div>
                            <div>
                                <label>Mobile No</label>
                                <input type="text" id="lead_mobile_no" placeholder="Mobile No">
                            </div>
                            <div>
                                <label>City</label>
                                <input type="text" id="lead_city" placeholder="City" value="Ranchi">
                            </div>
                            <div>
                                <label>State</label>
                                <input type="text" id="lead_state" placeholder="State" value="Jharkhand">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="cancel_lead" class="btn-black">Cancel</button>
                        <button id="save_lead" class="btn-green">Save</button>
                    </div>
                </div>
            </div>

            <!-- Events Modal -->
            <div id="events_modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">Events for Opportunity <span id="opportunity_name"></span></div>
                    <div class="modal-body">
                        <div id="events_list"></div>
                        <div id="no_events" style="display: none;">
                            <p>No events found for this opportunity.</p>
                            <button id="add_event" class="btn-blue">Add Event</button>
                        </div>
                        <div id="add_event_form" style="display: none;">
                            <h3>Add New Event</h3>
                            <div class="form-grid">
                                <div>
                                    <label>Subject *</label>
                                    <input type="text" id="event_subject" placeholder="Subject">
                                </div>
                                <div>
                                    <label>Starts On *</label>
                                    <input type="datetime-local" id="event_starts_on">
                                </div>
                                <div>
                                    <label>Description</label>
                                    <textarea id="event_description" placeholder="Description"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="cancel_event" class="btn-black">Close</button>
                        <button id="save_event" class="btn-green" style="display: none;">Save Event</button>
                    </div>
                </div>
            </div>
        </div>
    `);

    // Load Leads
    function loadLeads(view = "list") {
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Lead",
                fields: ["name", "lead_name", "status", "lead_owner"],
                filters: {
                    status: ["in", ["Lead", "Open", "Replied"]]
                },
                limit_page_length: 0
            },
            callback: function(response) {
                let leads = response.message || [];
                if (view === "list") {
                    $("#lead_table").empty();
                    leads.forEach(lead => {
                        $("#lead_table").append(`
                            <tr>
                                <td><span class="text-blue lead-link" data-lead="${lead.name}">${lead.lead_name || 'Not Provided'}</span></td>
                                <td>${lead.status}</td>
                                <td>
                                    <button class="btn-blue convert_to_opportunity" data-lead="${lead.name}">Convert to Opportunity</button>
                                </td>
                            </tr>
                        `);
                    });

                    // Add event listener for lead links
                    $(".lead-link").click(function() {
                        let leadName = $(this).data("lead");
                        window.location.href = `/app/lead/${leadName}`;
                    });

                    // Add event listener for Convert to Opportunity buttons
                    $(".convert_to_opportunity").click(function() {
                        let leadName = $(this).data("lead");
                        convertToOpportunity(leadName);
                    });
                } else if (view === "kanban") {
                    $("#lead_kanban_container").empty();
                    let statuses = ["Lead", "Open", "Replied"];
                    statuses.forEach(status => {
                        let columnLeads = leads.filter(lead => lead.status === status);
                        let columnHtml = `
                            <div class="kanban-column">
                                <h4>${status}</h4>
                                <div class="kanban-cards">
                                    ${columnLeads.map(lead => `
                                        <div class="kanban-card">
                                            <p><span class="text-blue lead-link" data-lead="${lead.name}">${lead.lead_name || 'Not Provided'}</span></p>
                                            <button class="btn-blue convert_to_opportunity" data-lead="${lead.name}">Convert to Opportunity</button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                        $("#lead_kanban_container").append(columnHtml);
                    });

                    // Add event listeners for Kanban view
                    $(".lead-link").click(function() {
                        let leadName = $(this).data("lead");
                        window.location.href = `/app/lead/${leadName}`;
                    });

                    $(".convert_to_opportunity").click(function() {
                        let leadName = $(this).data("lead");
                        convertToOpportunity(leadName);
                    });
                }
            }
        });
    }

    // Load Opportunities
    function loadOpportunities(view = "list") {
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Opportunity",
                fields: ["name", "customer_name", "status", "opportunity_owner", "owner"],
                limit_page_length: 0
            },
            callback: function(response) {
                let opportunities = response.message || [];
                if (view === "list") {
                    $("#opportunity_table").empty();
                    opportunities.forEach(opportunity => {
                        let badgeClass = opportunity.status === "Open" ? "badge-open" : "badge-closed";
                        $("#opportunity_table").append(`
                            <tr>
                                <td><span class="text-blue opportunity-link" data-opportunity="${opportunity.name}">${opportunity.name}</span></td>
                                <td>${opportunity.customer_name || 'Not Provided'}</td>
                                <td><span class="badge ${badgeClass}">${opportunity.status}</span></td>
                                <td>${opportunity.opportunity_owner || 'Not Provided'}</td>
                                <td>${opportunity.owner}</td>
                                <td>
                                    <button class="btn-blue view_events" data-opportunity="${opportunity.name}">View Events</button>
                                </td>
                            </tr>
                        `);
                    });

                    // Add event listener for opportunity links
                    $(".opportunity-link").click(function() {
                        let opportunityName = $(this).data("opportunity");
                        window.location.href = `/app/opportunity/${opportunityName}`;
                    });

                    // Add event listener for View Events buttons
                    $(".view_events").click(function() {
                        let opportunityName = $(this).data("opportunity");
                        showEvents(opportunityName);
                    });
                } else if (view === "kanban") {
                    $("#opportunity_kanban_container").empty();
                    let statuses = [...new Set(opportunities.map(op => op.status))]; // Unique statuses
                    statuses.forEach(status => {
                        let columnOpportunities = opportunities.filter(op => op.status === status);
                        let badgeClass = status === "Open" ? "badge-open" : "badge-closed";
                        let columnHtml = `
                            <div class="kanban-column">
                                <h4>${status}</h4>
                                <div class="kanban-cards">
                                    ${columnOpportunities.map(op => `
                                        <div class="kanban-card">
                                            <p><span class="text-blue opportunity-link" data-opportunity="${op.name}">${op.name}</span></p>
                                            <p>Customer: ${op.customer_name || 'Not Provided'}</p>
                                            <p>Owner: ${op.opportunity_owner || 'Not Provided'}</p>
                                            <p>Created By: ${op.owner}</p>
                                            <p>Status: <span class="badge ${badgeClass}">${op.status}</span></p>
                                            <button class="btn-blue view_events" data-opportunity="${op.name}">View Events</button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                        $("#opportunity_kanban_container").append(columnHtml);
                    });

                    // Add event listeners for Kanban view
                    $(".opportunity-link").click(function() {
                        let opportunityName = $(this).data("opportunity");
                        window.location.href = `/app/opportunity/${opportunityName}`;
                    });

                    $(".view_events").click(function() {
                        let opportunityName = $(this).data("opportunity");
                        showEvents(opportunityName);
                    });
                }
            }
        });
    }

    // Convert Lead to Opportunity
    function convertToOpportunity(leadName) {
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Lead",
                name: leadName
            },
            callback: function(leadResponse) {
                let lead = leadResponse.message;
                frappe.call({
                    method: "frappe.client.insert",
                    args: {
                        doc: {
                            doctype: "Opportunity",
                            opportunity_from: "Lead",
                            party_name: lead.name,
                            customer_name: lead.lead_name,
                            status: "Open",
                            opportunity_type: "Sales",
                            source: lead.source || "Website",
                            opportunity_owner: lead.lead_owner,
                            company: "Autowings Dev",
                            transaction_date: frappe.datetime.nowdate(),
                            currency: "INR",
                            conversion_rate: 1,
                            contact_email: lead.email_id,
                            contact_mobile: lead.mobile_no,
                            city: lead.city,
                            state: lead.state,
                            country: lead.country
                        }
                    },
                    callback: function(response) {
                        frappe.msgprint("Opportunity created successfully!");
                        loadOpportunities("list"); // Refresh opportunities list
                        loadLeads("list"); // Refresh leads list
                    },
                    error: function(err) {
                        frappe.msgprint("Error creating opportunity: " + err.message);
                    }
                });
            }
        });
    }

    // Show Events for an Opportunity
    function showEvents(opportunityName) {
        $("#opportunity_name").text(opportunityName);
        $("#events_list").empty();
        $("#no_events").hide();
        $("#add_event_form").hide();
        $("#save_event").hide();

        // Query the Event Participants child table to find events linked to the opportunity
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Event Participants",
                filters: {
                    reference_doctype: "Opportunity",
                    reference_docname: opportunityName
                },
                fields: ["parent"],
                limit_page_length: 0
            },
            callback: function(response) {
                let eventParticipants = response.message || [];
                let eventIds = eventParticipants.map(ep => ep.parent);

                if (eventIds.length === 0) {
                    $("#no_events").show();
                    $("#events_modal").show();
                    return;
                }

                // Fetch the events using the parent IDs
                frappe.call({
                    method: "frappe.client.get_list",
                    args: {
                        doctype: "Event",
                        filters: {
                            name: ["in", eventIds]
                        },
                        fields: ["name", "subject", "starts_on", "status"],
                        limit_page_length: 0
                    },
                    callback: function(eventResponse) {
                        let events = eventResponse.message || [];
                        if (events.length > 0) {
                            $("#events_list").show();
                            events.forEach(event => {
                                let badgeClass = event.status === "Open" ? "badge-open" : "badge-closed";
                                $("#events_list").append(`
                                    <p>
                                        <strong>${event.subject}</strong><br>
                                        Starts On: ${event.starts_on}<br>
                                        Status: <span class="badge ${badgeClass}">${event.status}</span>
                                    </p>
                                `);
                            });
                        } else {
                            $("#no_events").show();
                        }
                        $("#events_modal").show();
                    }
                });
            }
        });
    }

    // Create New Lead Modal
    $("#create_lead").click(() => {
        $("#create_lead_modal").show();
    });

    $("#cancel_lead").click(() => {
        $("#create_lead_modal").hide();
        clearLeadForm();
    });

    $("#save_lead").click(() => {
        let firstName = $("#lead_first_name").val();
        let middleName = $("#lead_middle_name").val();
        let lastName = $("#lead_last_name").val();
        let gender = $("#lead_gender").val();
        let source = $("#lead_source").val();
        let status = $("#lead_status").val();
        let email = $("#lead_email").val();
        let mobileNo = $("#lead_mobile_no").val();
        let city = $("#lead_city").val();
        let state = $("#lead_state").val();

        if (!firstName || !status) {
            frappe.msgprint("First Name and Status are required fields.");
            return;
        }

        let leadName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName || ''}`.trim() || firstName;

        frappe.call({
            method: "frappe.client.insert",
            args: {
                doc: {
                    doctype: "Lead",
                    first_name: firstName,
                    middle_name: middleName,
                    last_name: lastName,
                    lead_name: leadName,
                    gender: gender,
                    source: source,
                    status: status,
                    email_id: email,
                    mobile_no: mobileNo,
                    city: city,
                    state: state,
                    country: "India",
                    company: "Autowings Dev"
                }
            },
            callback: function(response) {
                frappe.msgprint("Lead created successfully!");
                $("#create_lead_modal").hide();
                clearLeadForm();
                loadLeads("list");
            },
            error: function(err) {
                frappe.msgprint("Error creating lead: " + err.message);
            }
        });
    });

    function clearLeadForm() {
        $("#lead_first_name").val("");
        $("#lead_middle_name").val("");
        $("#lead_last_name").val("");
        $("#lead_gender").val("");
        $("#lead_source").val("");
        $("#lead_status").val("Lead");
        $("#lead_email").val("");
        $("#lead_mobile_no").val("");
        $("#lead_city").val("Ranchi");
        $("#lead_state").val("Jharkhand");
    }

    // Add Event for Opportunity
    $("#add_event").click(() => {
        $("#no_events").hide();
        $("#add_event_form").show();
        $("#save_event").show();
    });

    $("#cancel_event").click(() => {
        $("#events_modal").hide();
        $("#add_event_form").hide();
        $("#save_event").hide();
        clearEventForm();
    });

    $("#save_event").click(() => {
        let subject = $("#event_subject").val();
        let startsOn = $("#event_starts_on").val();
        let description = $("#event_description").val();
        let opportunityName = $("#opportunity_name").text();

        if (!subject || !startsOn) {
            frappe.msgprint("Subject and Starts On are required fields.");
            return;
        }

        frappe.call({
            method: "frappe.client.insert",
            args: {
                doc: {
                    doctype: "Event",
                    subject: subject,
                    event_category: "Event",
                    event_type: "Private",
                    send_reminder: 1,
                    starts_on: startsOn,
                    status: "Open",
                    description: `<div class="ql-editor read-mode"><p>${description || ''}</p></div>`,
                    event_participants: [{
                        reference_doctype: "Opportunity",
                        reference_docname: opportunityName
                    }]
                }
            },
            callback: function(response) {
                frappe.msgprint("Event created successfully!");
                $("#events_modal").hide();
                clearEventForm();
                loadOpportunities("list"); // Refresh opportunities list
            },
            error: function(err) {
                frappe.msgprint("Error creating event: " + err.message);
            }
        });
    });

    function clearEventForm() {
        $("#event_subject").val("");
        $("#event_starts_on").val("");
        $("#event_description").val("");
    }

    // View Toggle for Leads
    $("#lead_list_view").click(() => {
        $("#lead_list_view").addClass("active");
        $("#lead_kanban_view").removeClass("active");
        $("#lead_list_container").show();
        $("#lead_kanban_container").hide();
        loadLeads("list");
    });

    $("#lead_kanban_view").click(() => {
        $("#lead_kanban_view").addClass("active");
        $("#lead_list_view").removeClass("active");
        $("#lead_list_container").hide();
        $("#lead_kanban_container").show();
        loadLeads("kanban");
    });

   // View Toggle for Opportunities
   $("#opportunity_list_view").click(() => {
	$("#opportunity_list_view").addClass("active");
	$("#opportunity_kanban_view").removeClass("active");
	$("#opportunity_list_container").show();
	$("#opportunity_kanban_container").hide();
	loadOpportunities("list");
});

$("#opportunity_kanban_view").click(() => {
	$("#opportunity_kanban_view").addClass("active");
	$("#opportunity_list_view").removeClass("active");
	$("#opportunity_list_container").hide();
	$("#opportunity_kanban_container").show();
	loadOpportunities("kanban");
});

// Load Data Initially
loadLeads("list");
loadOpportunities("list");
};


// frappe.pages['lead-and-opportunity'].on_page_load = function(wrapper) {
//     var page = frappe.ui.make_app_page({
//         parent: wrapper,
//         title: 'Lead and Opportunity Dashboard',
//         single_column: true
//     });

//     $(wrapper).html(`
//         <!-- Existing HTML remains the same until the Opportunities Kanban section -->
//         <style>
//             /* Existing styles remain the same */
//             .kanban-card {
//                 background-color: #ffffff;
//                 border: 1px solid #e5e7eb;
//                 border-radius: 4px;
//                 padding: 8px;
//                 margin-bottom: 8px;
//                 box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//                 cursor: move; /* Indicate draggable */
//             }
//             .kanban-card:hover {
//                 background-color: #f9fafb;
//             }
//             .modal-content {
//                 width: 90%;
//                 max-width: 800px; /* Wider modal for details */
//             }
//         </style>

//         <div class="container">
//             <!-- Leads Section remains unchanged -->

//             <!-- Opportunities Section -->
//             <div class="section">
//                 <div class="flex justify-between items-center" style="margin-bottom: 16px;">
//                     <h2>Opportunities</h2>
//                     <div class="view-toggle">
//                         <button id="opportunity_list_view">List View</button>
//                         <button id="opportunity_kanban_view" class="active">Kanban View</button>
//                     </div>
//                 </div>
//                 <div id="opportunity_list_container" class="table-container" style="display: none;">
//                     <table>
//                         <thead>
//                             <tr>
//                                 <th>Name</th>
//                                 <th>Customer Name</th>
//                                 <th>Status</th>
//                                 <th>Opportunity Owner</th>
//                                 <th>Created By</th>
//                                 <th>Action</th>
//                             </tr>
//                         </thead>
//                         <tbody id="opportunity_table"></tbody>
//                     </table>
//                 </div>
//                 <div id="opportunity_kanban_container" class="kanban-container"></div>
//             </div>

//             <!-- Opportunity Details Modal -->
//             <div id="opportunity_details_modal" class="modal">
//                 <div class="modal-content">
//                     <div class="modal-header">Opportunity Details <span id="modal_opportunity_name"></span></div>
//                     <div class="modal-body">
//                         <div id="opportunity_details"></div>
//                         <h3>Events</h3>
//                         <div id="events_list"></div>
//                         <div id="no_events" style="display: none;">
//                             <p>No events found for this opportunity.</p>
//                             <button id="add_event" class="btn-blue">Add Event</button>
//                         </div>
//                         <div id="add_event_form" style="display: none;">
//                             <h3>Add New Event</h3>
//                             <div class="form-grid">
//                                 <div>
//                                     <label>Subject *</label>
//                                     <input type="text" id="event_subject" placeholder="Subject">
//                                 </div>
//                                 <div>
//                                     <label>Starts On *</label>
//                                     <input type="datetime-local" id="event_starts_on">
//                                 </div>
//                                 <div>
//                                     <label>Description</label>
//                                     <textarea id="event_description" placeholder="Description"></textarea>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                     <div class="modal-footer">
//                         <button id="close_modal" class="btn-black">Close</button>
//                         <button id="save_event" class="btn-green" style="display: none;">Save Event</button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     `);

//     // Load Opportunities
//     function loadOpportunities(view = "kanban") { // Default to Kanban
//         frappe.call({
//             method: "frappe.client.get_list",
//             args: {
//                 doctype: "Opportunity",
//                 fields: ["name", "customer_name", "status", "opportunity_owner", "owner"],
//                 limit_page_length: 0
//             },
//             callback: function(response) {
//                 let opportunities = response.message || [];
//                 if (view === "list") {
//                     $("#opportunity_table").empty();
//                     opportunities.forEach(opportunity => {
//                         let badgeClass = opportunity.status === "Open" ? "badge-open" : "badge-closed";
//                         $("#opportunity_table").append(`
//                             <tr>
//                                 <td><span class="text-blue opportunity-link" data-opportunity="${opportunity.name}">${opportunity.name}</span></td>
//                                 <td>${opportunity.customer_name || 'Not Provided'}</td>
//                                 <td><span class="badge ${badgeClass}">${opportunity.status}</span></td>
//                                 <td>${opportunity.opportunity_owner || 'Not Provided'}</td>
//                                 <td>${opportunity.owner}</td>
//                                 <td>
//                                     <button class="btn-blue view_events" data-opportunity="${opportunity.name}">View Events</button>
//                                 </td>
//                             </tr>
//                         `);
//                     });
//                     $(".opportunity-link").click(function() {
//                         let opportunityName = $(this).data("opportunity");
//                         window.location.href = `/app/opportunity/${opportunityName}`;
//                     });
//                     $(".view_events").click(function() {
//                         let opportunityName = $(this).data("opportunity");
//                         showOpportunityDetails(opportunityName);
//                     });
//                 } else if (view === "kanban") {
//                     $("#opportunity_kanban_container").empty();
//                     let statuses = ["Open", "Quotation", "Converted", "Lost", "Won", "Closed"]; // Define possible statuses
//                     statuses.forEach(status => {
//                         let columnOpportunities = opportunities.filter(op => op.status === status);
//                         let badgeClass = status === "Open" ? "badge-open" : "badge-closed";
//                         let columnHtml = `
//                             <div class="kanban-column" data-status="${status}">
//                                 <h4>${status} <button class="btn-blue add-opportunity" data-status="${status}">+ Add Opportunity</button></h4>
//                                 <div class="kanban-cards" id="kanban-cards-${status}">
//                                     ${columnOpportunities.map(op => `
//                                         <div class="kanban-card" data-name="${op.name}" data-status="${op.status}">
//                                             <p><strong>${op.name}</strong></p>
//                                             <p>Customer: ${op.customer_name || 'Not Provided'}</p>
//                                             <p>Owner: ${op.opportunity_owner || 'Not Provided'}</p>
//                                             <p>Created By: ${op.owner}</p>
//                                             <p>Status: <span class="badge ${badgeClass}">${op.status}</span></p>
//                                         </div>
//                                     `).join('')}
//                                 </div>
//                             </div>
//                         `;
//                         $("#opportunity_kanban_container").append(columnHtml);
//                     });

//                     // Initialize drag-and-drop
//                     $(".kanban-card").draggable({
//                         revert: "invalid", // Revert if not dropped on a valid target
//                         containment: "#opportunity_kanban_container",
//                         helper: "clone",
//                         start: function(event, ui) {
//                             $(this).css("opacity", "0.7");
//                         },
//                         stop: function(event, ui) {
//                             $(this).css("opacity", "1");
//                         }
//                     });

//                     $(".kanban-column").droppable({
//                         accept: ".kanban-card",
//                         drop: function(event, ui) {
//                             let card = ui.draggable;
//                             let newStatus = $(this).data("status");
//                             let opportunityName = card.data("name");
//                             updateOpportunityStatus(opportunityName, newStatus);
//                             card.detach().appendTo($(this).find(".kanban-cards")).css({ top: 0, left: 0 });
//                         }
//                     });

//                     // Click to open modal
//                     $(".kanban-card").click(function(e) {
//                         e.preventDefault();
//                         let opportunityName = $(this).data("name");
//                         showOpportunityDetails(opportunityName);
//                     });

//                     // Add new opportunity button
//                     $(".add-opportunity").click(function() {
//                         let status = $(this).data("status");
//                         // Logic to open a form or create a new opportunity can be added here
//                         frappe.new_doc("Opportunity", {
//                             status: status,
//                             company: "Autowings Dev"
//                         });
//                     });
//                 }
//             }
//         });
//     }

//     // Update Opportunity Status
//     function updateOpportunityStatus(opportunityName, newStatus) {
//         frappe.call({
//             method: "frappe.client.set_value",
//             args: {
//                 doctype: "Opportunity",
//                 name: opportunityName,
//                 fieldname: "status",
//                 value: newStatus
//             },
//             callback: function(response) {
//                 if (response.message) {
//                     frappe.msgprint("Status updated successfully!");
//                     loadOpportunities("kanban"); // Reload to reflect changes
//                 }
//             },
//             error: function(err) {
//                 frappe.msgprint("Error updating status: " + err.message);
//             }
//         });
//     }

//     // Show Opportunity Details in Modal
//     function showOpportunityDetails(opportunityName) {
//         $("#modal_opportunity_name").text(opportunityName);
//         $("#opportunity_details").empty();
//         $("#events_list").empty();
//         $("#no_events").hide();
//         $("#add_event_form").hide();
//         $("#save_event").hide();

//         // Fetch opportunity details
//         frappe.call({
//             method: "frappe.client.get",
//             args: {
//                 doctype: "Opportunity",
//                 name: opportunityName
//             },
//             callback: function(response) {
//                 let opportunity = response.message;
//                 let badgeClass = opportunity.status === "Open" ? "badge-open" : "badge-closed";
//                 $("#opportunity_details").html(`
//                     <div class="form-grid">
//                         <div><strong>Name:</strong> ${opportunity.name}</div>
//                         <div><strong>Customer Name:</strong> ${opportunity.customer_name || 'Not Provided'}</div>
//                         <div><strong>Status:</strong> <span class="badge ${badgeClass}">${opportunity.status}</span></div>
//                         <div><strong>Opportunity Owner:</strong> ${opportunity.opportunity_owner || 'Not Provided'}</div>
//                         <div><strong>Created By:</strong> ${opportunity.owner}</div>
//                     </div>
//                 `);

//                 // Fetch events
//                 frappe.call({
//                     method: "frappe.client.get_list",
//                     args: {
//                         doctype: "Event Participants",
//                         filters: {
//                             reference_doctype: "Opportunity",
//                             reference_docname: opportunityName
//                         },
//                         fields: ["parent"],
//                         limit_page_length: 0
//                     },
//                     callback: function(participantsResponse) {
//                         let eventParticipants = participantsResponse.message || [];
//                         let eventIds = eventParticipants.map(ep => ep.parent);

//                         if (eventIds.length === 0) {
//                             $("#no_events").show();
//                         } else {
//                             frappe.call({
//                                 method: "frappe.client.get_list",
//                                 args: {
//                                     doctype: "Event",
//                                     filters: {
//                                         name: ["in", eventIds]
//                                     },
//                                     fields: ["name", "subject", "starts_on", "status"],
//                                     limit_page_length: 0
//                                 },
//                                 callback: function(eventResponse) {
//                                     let events = eventResponse.message || [];
//                                     if (events.length > 0) {
//                                         $("#events_list").show();
//                                         events.forEach(event => {
//                                             let eventBadgeClass = event.status === "Open" ? "badge-open" : "badge-closed";
//                                             $("#events_list").append(`
//                                                 <p>
//                                                     <strong>${event.subject}</strong><br>
//                                                     Starts On: ${event.starts_on}<br>
//                                                     Status: <span class="badge ${eventBadgeClass}">${event.status}</span>
//                                                 </p>
//                                             `);
//                                         });
//                                     } else {
//                                         $("#no_events").show();
//                                     }
//                                 }
//                             });
//                         }
//                         $("#opportunity_details_modal").show();
//                     }
//                 });
//             }
//         });

//         // Add Event functionality
//         $("#add_event").click(() => {
//             $("#no_events").hide();
//             $("#add_event_form").show();
//             $("#save_event").show();
//         });

//         $("#close_modal").click(() => {
//             $("#opportunity_details_modal").hide();
//             $("#add_event_form").hide();
//             $("#save_event").hide();
//             clearEventForm();
//         });

//         $("#save_event").click(() => {
//             let subject = $("#event_subject").val();
//             let startsOn = $("#event_starts_on").val();
//             let description = $("#event_description").val();

//             if (!subject || !startsOn) {
//                 frappe.msgprint("Subject and Starts On are required fields.");
//                 return;
//             }

//             frappe.call({
//                 method: "frappe.client.insert",
//                 args: {
//                     doc: {
//                         doctype: "Event",
//                         subject: subject,
//                         event_category: "Event",
//                         event_type: "Private",
//                         send_reminder: 1,
//                         starts_on: startsOn,
//                         status: "Open",
//                         description: `<div class="ql-editor read-mode"><p>${description || ''}</p></div>`,
//                         event_participants: [{
//                             reference_doctype: "Opportunity",
//                             reference_docname: opportunityName
//                         }]
//                     }
//                 },
//                 callback: function(response) {
//                     frappe.msgprint("Event created successfully!");
//                     $("#add_event_form").hide();
//                     $("#save_event").hide();
//                     showOpportunityDetails(opportunityName); // Refresh modal
//                 },
//                 error: function(err) {
//                     frappe.msgprint("Error creating event: " + err.message);
//                 }
//             });
//         });

//         function clearEventForm() {
//             $("#event_subject").val("");
//             $("#event_starts_on").val("");
//             $("#event_description").val("");
//         }
//     }

//     // View Toggle for Opportunities
//     $("#opportunity_list_view").click(() => {
//         $("#opportunity_list_view").addClass("active");
//         $("#opportunity_kanban_view").removeClass("active");
//         $("#opportunity_list_container").show();
//         $("#opportunity_kanban_container").hide();
//         loadOpportunities("list");
//     });

//     $("#opportunity_kanban_view").click(() => {
//         $("#opportunity_kanban_view").addClass("active");
//         $("#opportunity_list_view").removeClass("active");
//         $("#opportunity_list_container").hide();
//         $("#opportunity_kanban_container").show();
//         loadOpportunities("kanban");
//     });

//     // Load Data Initially
//     loadOpportunities("kanban"); // Default to Kanban view
// };