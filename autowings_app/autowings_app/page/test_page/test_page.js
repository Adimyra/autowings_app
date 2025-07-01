// File: your_app/your_module/public/js/test-page.js

frappe.pages['test-page'].on_page_load = function(wrapper) {
    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Test Page',
        single_column: true
    });

    // Add your text content here
    $(page.body).append(`
        <div class="my-test-page">
            <h2>Welcome to the Test Page</h2>
            <p>This is a custom Frappe Desk page with static text content.</p>
        </div>
    `);
};

// frappe.pages['test-page'].on_page_load = function(wrapper) {
// 	var page = frappe.ui.make_app_page({
// 		parent: wrapper,
// 		title: 'TEST PAGE',
// 		single_column: true
// 	});

// 	// autowings_app/autowings_app/page/crm_dashboard/crm_dashboard.js
// // frappe.pages['crm_dashboard'].on_page_load = function(wrapper) {
// //     console.log("Loading CRM Dashboard page...");
// //     var page = frappe.ui.make_app_page({
// //         parent: wrapper,
// //         title: 'CRM Dashboard',
// //         single_column: true
// //     });

//     // Define HTML and CSS
//     const page_content = `
//         <style>
//             body {
//                 background-color: #f3f4f6;
//                 padding: 24px;
//                 font-family: sans-serif;
//             }
//             .container {
//                 margin: 0 auto;
//             }
//             .section {
//                 background-color: #ffffff;
//                 box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//                 border-radius: 8px;
//                 padding: 24px;
//                 margin-bottom: 32px;
//             }
//             h2 {
//                 font-size: 24px;
//                 font-weight: bold;
//                 margin-bottom: 8px;
//                 color: #162c2a;
//             }
//             h3 {
//                 font-size: 18px;
//                 font-weight: bold;
//                 margin-bottom: 16px;
//                 color: #162c2a;
//             }
//             .text-gray {
//                 color: #6b7280;
//             }
//             .text-dark {
//                 color: #162c2a;
//             }
//             .form-grid {
//                 display: grid;
//                 grid-template-columns: 1fr;
//                 gap: 16px;
//                 padding: 20px 0;
//             }
//             label {
//                 display: block;
//                 font-size: 14px;
//                 color: #19504b;
//                 margin-bottom: 4px;
//                 font-weight: bold;
//             }
//             input, select, textarea {
//                 width: 100%;
//                 padding: 8px 12px;
//                 border: 1px solid #d1d5db;
//                 border-radius: 4px;
//                 font-size: 14px;
//                 box-sizing: border-box;
//             }
//             input[type="text"]::placeholder, textarea::placeholder {
//                 color: #9ca3af;
//             }
//             button {
//                 padding: 4px 16px;
//                 font-size: 14px;
//                 border-radius: 4px;
//                 cursor: pointer;
//             }
//             .btn-black {
//                 background-color: #162c2a;
//                 color: #ffffff;
//             }
//             .btn-black:hover {
//                 background-color: #19504b;
//             }
//             .btn-green {
//                 background-color: #16a34a;
//                 color: #ffffff;
//             }
//             .btn-green:hover {
//                 background-color: #15803d;
//             }
//             .btn-blue {
//                 background-color: #1e40af;
//                 color: #ffffff;
//             }
//             .btn-blue:hover {
//                 background-color: #1e3a8a;
//             }
//             .flex {
//                 display: flex;
//             }
//             .justify-between {
//                 justify-content: space-between;
//             }
//             .items-center {
//                 align-items: center;
//             }
//             .gap-2 {
//                 gap: 8px;
//             }
//             .table-container {
//                 overflow-x: auto;
//             }
//             table {
//                 width: 100%;
//                 border: 1px solid #e5e7eb;
//                 font-size: 14px;
//             }
//             thead {
//                 background-color: #f9fafb;
//             }
//             th {
//                 text-align: left;
//                 padding: 8px 16px;
//                 border-bottom: 1px solid #e5e7eb;
//                 color: #162c2a;
//             }
//             tbody tr:nth-child(even) {
//                 background-color: #f9fafb;
//             }
//             tbody tr:hover {
//                 background-color: #f3f4f6;
//             }
//             td {
//                 padding: 8px 16px;
//                 border-bottom: 1px solid #e5e7eb;
//             }
//             .badge {
//                 padding: 2px 8px;
//                 border-radius: 9999px;
//                 font-size: 12px;
//             }
//             .badge-open {
//                 background-color: #dbeafe;
//                 color: #1e40af;
//             }
//             .badge-closed {
//                 background-color: #dcfce7;
//                 color: #166534;
//             }
//             .text-blue {
//                 color: #19504b;
//                 cursor: pointer;
//             }
//             .text-blue:hover {
//                 text-decoration: underline;
//             }
//             .kanban-container {
//                 display: flex;
//                 gap: 16px;
//                 overflow-x: auto;
//                 padding: 16px 0;
//             }
//             .kanban-column {
//                 background-color: #f9fafb;
//                 border-radius: 8px;
//                 padding: 16px;
//                 width: 300px;
//                 min-height: 200px;
//             }
//             .kanban-column h4 {
//                 margin-bottom: 16px;
//                 color: #162c2a;
//                 font-weight: bold;
//             }
//             .kanban-card {
//                 background-color: #ffffff;
//                 border: 1px solid #e5e7eb;
//                 border-radius: 4px;
//                 padding: 8px;
//                 margin-bottom: 8px;
//                 box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//             }
//             .kanban-card p {
//                 margin: 0;
//             }
//             .view-toggle {
//                 display: flex;
//                 gap: 8px;
//                 margin-bottom: 16px;
//             }
//             .view-toggle button {
//                 padding: 4px 12px;
//                 font-size: 14px;
//                 border-radius: 4px;
//                 cursor: pointer;
//                 border: 1px solid #d1d5db;
//                 background-color: #ffffff;
//             }
//             .view-toggle button.active {
//                 background-color: #162c2a;
//                 color: #ffffff;
//                 border-color: #162c2a;
//             }
//             .modal {
//                 display: none;
//                 position: fixed;
//                 top: 0;
//                 left: 0;
//                 width: 100%;
//                 height: 100%;
//                 background-color: rgba(0, 0, 0, 0.5);
//                 z-index: 1000;
//                 justify-content: center;
//                 align-items: center;
//             }
//             .modal-content {
//                 background-color: #ffffff;
//                 padding: 20px;
//                 border-radius: 8px;
//                 width: 90%;
//                 max-width: 600px;
//                 max-height: 80vh;
//                 overflow-y: auto;
//             }
//             .modal-header {
//                 font-size: 18px;
//                 font-weight: bold;
//                 color: #162c2a;
//                 margin-bottom: 16px;
//             }
//             .modal-body {
//                 margin-bottom: 16px;
//             }
//             .modal-footer {
//                 display: flex;
//                 gap: 8px;
//                 justify-content: flex-end;
//             }
//         </style>

//         <div class="container">
//             <!-- Leads Section -->
//             <div class="section">
//                 <div class="flex justify-between items-center" style="margin-bottom: 16px;">
//                     <h2>Leads</h2>
//                     <div class="flex gap-2">
//                         <div class="view-toggle">
//                             <button id="lead_list_view" class="active">List View</button>
//                             <button id="lead_kanban_view">Kanban View</button>
//                         </div>
//                         <button id="create_lead" class="btn-black">Create New Lead</button>
//                     </div>
//                 </div>
//                 <div id="lead_list_container" class="table-container">
//                     <table>
//                         <thead>
//                             <tr>
//                                 <th>Name</th>
//                                 <th>Status</th>
//                                 <th>Action</th>
//                             </tr>
//                         </thead>
//                         <tbody id="lead_table"></tbody>
//                     </table>
//                 </div>
//                 <div id="lead_kanban_container" class="kanban-container" style="display: none;"></div>
//             </div>

//             <!-- Opportunities Section -->
//             <div class="section">
//                 <div class="flex justify-between items-center" style="margin-bottom: 16px;">
//                     <h2>Opportunities</h2>
//                     <div class="view-toggle">
//                         <button id="opportunity_list_view" class="active">List View</button>
//                         <button id="opportunity_kanban_view">Kanban View</button>
//                     </div>
//                 </div>
//                 <div id="opportunity_list_container" class="table-container">
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
//                 <div id="opportunity_kanban_container" class="kanban-container" style="display: none;"></div>
//             </div>

//             <!-- Custom Tasks Section -->
//             <div class="section">
//                 <div class="flex justify-between items-center" style="margin-bottom: 16px;">
//                     <h2>Custom Tasks</h2>
//                     <div class="view-toggle">
//                         <button id="task_list_view" class="active">List View</button>
//                         <button id="task_kanban_view">Kanban View</button>
//                     </div>
//                     <button id="create_task" class="btn-black">Create New Task</button>
//                 </div>
//                 <div id="task_list_container" class="table-container">
//                     <table>
//                         <thead>
//                             <tr>
//                                 <th>Title</th>
//                                 <th>Status</th>
//                                 <th>Due Date</th>
//                                 <th>Assigned To</th>
//                                 <th>Action</th>
//                             </tr>
//                         </thead>
//                         <tbody id="task_table"></tbody>
//                     </table>
//                 </div>
//                 <div id="task_kanban_container" class="kanban-container" style="display: none;"></div>
//             </div>

//             <!-- Create Lead Modal -->
//             <div id="create_lead_modal" class="modal">
//                 <div class="modal-content">
//                     <div class="modal-header">New Lead</div>
//                     <div class="modal-body">
//                         <div class="form-grid">
//                             <div><label>First Name *</label><input type="text" id="lead_first_name" placeholder="First Name"></div>
//                             <div><label>Middle Name</label><input type="text" id="lead_middle_name" placeholder="Middle Name"></div>
//                             <div><label>Last Name</label><input type="text" id="lead_last_name" placeholder="Last Name"></div>
//                             <div><label>Gender</label><select id="lead_gender"><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
//                             <div><label>Source</label><select id="lead_source"><option value="">Select Source</option><option value="Website">Website</option><option value="Campaign">Campaign</option><option value="Referral">Referral</option></select></div>
//                             <div><label>Status *</label><select id="lead_status"><option value="Lead">Lead</option><option value="Open">Open</option><option value="Replied">Replied</option><option value="Opportunity">Opportunity</option><option value="Quotation">Quotation</option><option value="Lost Quotation">Lost Quotation</option><option value="Interested">Interested</option><option value="Converted">Converted</option><option value="Do Not Contact">Do Not Contact</option></select></div>
//                             <div><label>Email</label><input type="email" id="lead_email" placeholder="Email"></div>
//                             <div><label>Mobile No</label><input type="text" id="lead_mobile_no" placeholder="Mobile No"></div>
//                             <div><label>City</label><input type="text" id="lead_city" placeholder="City" value="Ranchi"></div>
//                             <div><label>State</label><input type="text" id="lead_state" placeholder="State" value="Jharkhand"></div>
//                         </div>
//                     </div>
//                     <div class="modal-footer">
//                         <button id="cancel_lead" class="btn-black">Cancel</button>
//                         <button id="save_lead" class="btn-green">Save</button>
//                     </div>
//                 </div>
//             </div>

//             <!-- Create Custom Task Modal -->
//             <div id="create_task_modal" class="modal">
//                 <div class="modal-content">
//                     <div class="modal-header">New Custom Task</div>
//                     <div class="modal-body">
//                         <div class="form-grid">
//                             <div><label>Task Title *</label><input type="text" id="task_title" placeholder="Task Title"></div>
//                             <div><label>Description</label><textarea id="task_description" placeholder="Description"></textarea></div>
//                             <div><label>Assigned To</label><input type="text" id="task_assigned_to" placeholder="Assigned To"></div>
//                             <div><label>Assigned Date</label><input type="date" id="task_assigned_date"></div>
//                             <div><label>Due Date</label><input type="date" id="task_due_date"></div>
//                             <div><label>Client Feedback</label><textarea id="task_client_feedback" placeholder="Client Feedback"></textarea></div>
//                             <div><label>Next Steps</label><textarea id="task_next_steps" placeholder="Next Steps"></textarea></div>
//                             <div><label>Status *</label><select id="task_status"><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></select></div>
//                             <div><label>Lead</label><input type="text" id="task_lead" placeholder="Lead"></div>
//                             <div><label>Opportunity</label><input type="text" id="task_opportunity" placeholder="Opportunity"></div>
//                             <div><label>Activity Log</label><table class="table" id="task_activity_log"><thead><tr><th>Date</th><th>Description</th><th>Added By</th><th></th></tr></thead><tbody></tbody></table><button id="add_activity" class="btn-blue">Add Activity</button></div>
//                         </div>
//                     </div>
//                     <div class="modal-footer">
//                         <button id="cancel_task" class="btn-black">Cancel</button>
//                         <button id="save_task" class="btn-green">Save</button>
//                     </div>
//                 </div>
//             </div>

//             <!-- Events Modal -->
//             <div id="events_modal" class="modal">
//                 <div class="modal-content">
//                     <div class="modal-header">Events for Opportunity <span id="opportunity_name"></span></div>
//                     <div class="modal-body">
//                         <div id="events_list"></div>
//                         <div id="no_events" style="display: none;">
//                             <p>No events found for this opportunity.</p>
//                             <button id="add_event" class="btn-blue">Add Event</button>
//                         </div>
//                         <div id="add_event_form" style="display: none;">
//                             <h3>Add New Event</h3>
//                             <div class="form-grid">
//                                 <div><label>Subject *</label><input type="text" id="event_subject" placeholder="Subject"></div>
//                                 <div><label>Starts On *</label><input type="datetime-local" id="event_starts_on"></div>
//                                 <div><label>Description</label><textarea id="event_description" placeholder="Description"></textarea></div>
//                             </div>
//                         </div>
//                     </div>
//                     <div class="modal-footer">
//                         <button id="cancel_event" class="btn-black">Close</button>
//                         <button id="save_event" class="btn-green" style="display: none;">Save Event</button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     `;

//     // Inject HTML into page
//     $(page.body).html(page_content);

//     // Load Leads
//     function loadLeads(view = "list") {
//         console.log("Loading Leads...");
//         frappe.call({
//             method: "frappe.client.get_list",
//             args: {
//                 doctype: "Lead",
//                 fields: ["name", "lead_name", "status", "lead_owner"],
//                 filters: { status: ["in", ["Lead", "Open", "Replied"]] },
//                 limit_page_length: 0
//             },
//             callback: function(response) {
//                 console.log("Leads response:", response);
//                 let leads = response.message || [];
//                 if (view === "list") {
//                     $("#lead_table").empty();
//                     leads.forEach(lead => {
//                         $("#lead_table").append(`
//                             <tr>
//                                 <td><span class="text-blue lead-link" data-lead="${lead.name}">${lead.lead_name || 'Not Provided'}</span></td>
//                                 <td>${lead.status}</td>
//                                 <td><button class="btn-blue convert_to_opportunity" data-lead="${lead.name}">Convert</button></td>
//                             </tr>
//                         `);
//                     });
//                     $(".lead-link").click(function() { window.location.href = `/app/lead/${$(this).data("lead")}`; });
//                     $(".convert_to_opportunity").click(function() { convertToOpportunity($(this).data("lead")); });
//                 } else if (view === "kanban") {
//                     $("#lead_kanban_container").empty();
//                     let statuses = ["Lead", "Open", "Replied"];
//                     statuses.forEach(status => {
//                         let columnLeads = leads.filter(lead => lead.status === status);
//                         $("#lead_kanban_container").append(`
//                             <div class="kanban-column">
//                                 <h4>${status}</h4>
//                                 ${columnLeads.map(lead => `
//                                     <div class="kanban-card">
//                                         <p><span class="text-blue lead-link" data-lead="${lead.name}">${lead.lead_name || 'Not Provided'}</span></p>
//                                         <button class="btn-blue convert_to_opportunity" data-lead="${lead.name}">Convert</button>
//                                     </div>
//                                 `).join('')}
//                             </div>
//                         `);
//                     });
//                     $(".lead-link").click(function() { window.location.href = `/app/lead/${$(this).data("lead")}`; });
//                     $(".convert_to_opportunity").click(function() { convertToOpportunity($(this).data("lead")); });
//                 }
//             },
//             error: function(err) {
//                 console.error("Error loading Leads:", err);
//                 frappe.msgprint("Failed to load Leads.");
//             }
//         });
//     }

//     // Load Opportunities
//     function loadOpportunities(view = "list") {
//         console.log("Loading Opportunities...");
//         frappe.call({
//             method: "frappe.client.get_list",
//             args: {
//                 doctype: "Opportunity",
//                 fields: ["name", "customer_name", "status", "opportunity_owner", "owner"],
//                 limit_page_length: 0
//             },
//             callback: function(response) {
//                 console.log("Opportunities response:", response);
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
//                                 <td><button class="btn-blue view_events" data-opportunity="${opportunity.name}">View Events</button></td>
//                             </tr>
//                         `);
//                     });
//                     $(".opportunity-link").click(function() { window.location.href = `/app/opportunity/${$(this).data("opportunity")}`; });
//                     $(".view_events").click(function() { showEvents($(this).data("opportunity")); });
//                 } else if (view === "kanban") {
//                     $("#opportunity_kanban_container").empty();
//                     let statuses = [...new Set(opportunities.map(op => op.status))];
//                     statuses.forEach(status => {
//                         let columnOpportunities = opportunities.filter(op => op.status === status);
//                         let badgeClass = status === "Open" ? "badge-open" : "badge-closed";
//                         $("#opportunity_kanban_container").append(`
//                             <div class="kanban-column">
//                                 <h4>${status}</h4>
//                                 ${columnOpportunities.map(op => `
//                                     <div class="kanban-card">
//                                         <p><span class="text-blue opportunity-link" data-opportunity="${op.name}">${op.name}</span></p>
//                                         <p>Customer: ${op.customer_name || 'Not Provided'}</p>
//                                         <p>Owner: ${op.opportunity_owner || 'Not Provided'}</p>
//                                         <p>Created By: ${op.owner}</p>
//                                         <p>Status: <span class="badge ${badgeClass}">${op.status}</span></p>
//                                         <button class="btn-blue view_events" data-opportunity="${op.name}">View Events</button>
//                                     </div>
//                                 `).join('')}
//                             </div>
//                         `);
//                     });
//                     $(".opportunity-link").click(function() { window.location.href = `/app/opportunity/${$(this).data("opportunity")}`; });
//                     $(".view_events").click(function() { showEvents($(this).data("opportunity")); });
//                 }
//             },
//             error: function(err) {
//                 console.error("Error loading Opportunities:", err);
//                 frappe.msgprint("Failed to load Opportunities.");
//             }
//         });
//     }

//     // Load Custom Tasks
//     function loadTasks(view = "list") {
//         console.log("Loading Custom Tasks...");
//         frappe.call({
//             method: "frappe.client.get_list",
//             args: {
//                 doctype: "Custom Task",
//                 fields: ["name", "task_title", "status", "due_date", "assigned_to"],
//                 limit_page_length: 0
//             },
//             callback: function(response) {
//                 console.log("Custom Tasks response:", response);
//                 let tasks = response.message || [];
//                 if (view === "list") {
//                     $("#task_table").empty();
//                     tasks.forEach(task => {
//                         let badgeClass = task.status === "Open" ? "badge-open" : "badge-closed";
//                         $("#task_table").append(`
//                             <tr>
//                                 <td><span class="text-blue task-link" data-task="${task.name}">${task.task_title || 'Not Provided'}</span></td>
//                                 <td><span class="badge ${badgeClass}">${task.status}</span></td>
//                                 <td>${task.due_date || 'Not Set'}</td>
//                                 <td>${task.assigned_to || 'Not Assigned'}</td>
//                                 <td><button class="btn-blue edit_task" data-task="${task.name}">Edit</button></td>
//                             </tr>
//                         `);
//                     });
//                     $(".task-link").click(function() { window.location.href = `/app/custom-task/${$(this).data("task")}`; });
//                     $(".edit_task").click(function() { editTask($(this).data("task")); });
//                 } else if (view === "kanban") {
//                     $("#task_kanban_container").empty();
//                     let statuses = ["Open", "In Progress", "Completed", "Cancelled"];
//                     statuses.forEach(status => {
//                         let columnTasks = tasks.filter(task => task.status === status);
//                         let badgeClass = status === "Open" ? "badge-open" : "badge-closed";
//                         $("#task_kanban_container").append(`
//                             <div class="kanban-column">
//                                 <h4>${status}</h4>
//                                 ${columnTasks.map(task => `
//                                     <div class="kanban-card">
//                                         <p><span class="text-blue task-link" data-task="${task.name}">${task.task_title || 'Not Provided'}</span></p>
//                                         <p>Due: ${task.due_date || 'Not Set'}</p>
//                                         <p>Assigned To: ${task.assigned_to || 'Not Assigned'}</p>
//                                         <p>Status: <span class="badge ${badgeClass}">${task.status}</span></p>
//                                         <button class="btn-blue edit_task" data-task="${task.name}">Edit</button>
//                                     </div>
//                                 `).join('')}
//                             </div>
//                         `);
//                     });
//                     $(".task-link").click(function() { window.location.href = `/app/custom-task/${$(this).data("task")}`; });
//                     $(".edit_task").click(function() { editTask($(this).data("task")); });
//                 }
//             },
//             error: function(err) {
//                 console.error("Error loading Custom Tasks:", err);
//                 frappe.msgprint("Failed to load Custom Tasks.");
//             }
//         });
//     }

//     // Convert Lead to Opportunity
//     function convertToOpportunity(leadName) {
//         console.log("Converting Lead to Opportunity:", leadName);
//         frappe.call({
//             method: "frappe.client.get",
//             args: { doctype: "Lead", name: leadName },
//             callback: function(leadResponse) {
//                 let lead = leadResponse.message;
//                 frappe.call({
//                     method: "frappe.client.insert",
//                     args: {
//                         doc: {
//                             doctype: "Opportunity",
//                             opportunity_from: "Lead",
//                             party_name: lead.name,
//                             customer_name: lead.lead_name,
//                             status: "Open",
//                             opportunity_type: "Sales",
//                             source: lead.source || "Website",
//                             opportunity_owner: lead.lead_owner,
//                             company: "Autowings",
//                             transaction_date: frappe.datetime.nowdate(),
//                             currency: "INR",
//                             conversion_rate: 1,
//                             contact_email: lead.email_id,
//                             contact_mobile: lead.mobile_no,
//                             city: lead.city,
//                             state: lead.state,
//                             country: lead.country
//                         }
//                     },
//                     callback: function() {
//                         frappe.msgprint("Opportunity created successfully!");
//                         loadOpportunities("list");
//                         loadLeads("list");
//                     },
//                     error: function(err) {
//                         console.error("Error converting to Opportunity:", err);
//                         frappe.msgprint("Failed to create Opportunity.");
//                     }
//                 });
//             },
//             error: function(err) {
//                 console.error("Error fetching Lead:", err);
//                 frappe.msgprint("Failed to fetch Lead.");
//             }
//         });
//     }

//     // Show Events for an Opportunity
//     function showEvents(opportunityName) {
//         console.log("Showing Events for Opportunity:", opportunityName);
//         $("#opportunity_name").text(opportunityName);
//         $("#events_list").empty();
//         $("#no_events").hide();
//         $("#add_event_form").hide();
//         $("#save_event").hide();

//         frappe.call({
//             method: "frappe.client.get_list",
//             args: {
//                 doctype: "Event Participants",
//                 filters: { reference_doctype: "Opportunity", reference_docname: opportunityName },
//                 fields: ["parent"],
//                 limit_page_length: 0
//             },
//             callback: function(response) {
//                 let eventParticipants = response.message || [];
//                 let eventIds = eventParticipants.map(ep => ep.parent);

//                 if (eventIds.length === 0) {
//                     $("#no_events").show();
//                     $("#events_modal").show();
//                     return;
//                 }

//                 frappe.call({
//                     method: "frappe.client.get_list",
//                     args: {
//                         doctype: "Event",
//                         filters: { name: ["in", eventIds] },
//                         fields: ["name", "subject", "starts_on", "status"],
//                         limit_page_length: 0
//                     },
//                     callback: function(eventResponse) {
//                         let events = eventResponse.message || [];
//                         if (events.length > 0) {
//                             events.forEach(event => {
//                                 let badgeClass = event.status === "Open" ? "badge-open" : "badge-closed";
//                                 $("#events_list").append(`
//                                     <p><strong>${event.subject}</strong><br>Starts On: ${event.starts_on}<br>Status: <span class="badge ${badgeClass}">${event.status}</span></p>
//                                 `);
//                             });
//                         } else {
//                             $("#no_events").show();
//                         }
//                         $("#events_modal").show();
//                     },
//                     error: function(err) {
//                         console.error("Error loading Events:", err);
//                         frappe.msgprint("Failed to load Events.");
//                     }
//                 });
//             },
//             error: function(err) {
//                 console.error("Error fetching Event Participants:", err);
//                 frappe.msgprint("Failed to fetch Events.");
//             }
//         });
//     }

//     // Create New Lead
//     $("#create_lead").click(() => {
//         console.log("Opening Create Lead modal...");
//         $("#create_lead_modal").show();
//     });

//     $("#cancel_lead").click(() => {
//         $("#create_lead_modal").hide();
//         clearLeadForm();
//     });

//     $("#save_lead").click(() => {
//         let firstName = $("#lead_first_name").val();
//         let middleName = $("#lead_middle_name").val();
//         let lastName = $("#lead_last_name").val();
//         let gender = $("#lead_gender").val();
//         let source = $("#lead_source").val();
//         let status = $("#lead_status").val();
//         let email = $("#lead_email").val();
//         let mobileNo = $("#lead_mobile_no").val();
//         let city = $("#lead_city").val();
//         let state = $("#lead_state").val();

//         if (!firstName || !status) {
//             frappe.msgprint("First Name and Status are required fields.");
//             return;
//         }

//         let leadName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName || ''}`.trim() || firstName;

//         frappe.call({
//             method: "frappe.client.insert",
//             args: {
//                 doc: {
//                     doctype: "Lead",
//                     first_name: firstName,
//                     middle_name: middleName,
//                     last_name: lastName,
//                     lead_name: leadName,
//                     gender: gender,
//                     source: source,
//                     status: status,
//                     email_id: email,
//                     mobile_no: mobileNo,
//                     city: city,
//                     state: state,
//                     country: "India",
//                     company: "Autowings"
//                 }
//             },
//             callback: function() {
//                 frappe.msgprint("Lead created successfully!");
//                 $("#create_lead_modal").hide();
//                 clearLeadForm();
//                 loadLeads("list");
//             },
//             error: function(err) {
//                 console.error("Error creating Lead:", err);
//                 frappe.msgprint("Failed to create Lead.");
//             }
//         });
//     });

//     function clearLeadForm() {
//         $("#lead_first_name").val("");
//         $("#lead_middle_name").val("");
//         $("#lead_last_name").val("");
//         $("#lead_gender").val("");
//         $("#lead_source").val("");
//         $("#lead_status").val("Lead");
//         $("#lead_email").val("");
//         $("#lead_mobile_no").val("");
//         $("#lead_city").val("Ranchi");
//         $("#lead_state").val("Jharkhand");
//     }

//     // Create New Custom Task
//     $("#create_task").click(() => {
//         console.log("Opening Create Task modal...");
//         $("#create_task_modal").show();
//     });

//     $("#cancel_task").click(() => {
//         $("#create_task_modal").hide();
//         clearTaskForm();
//     });

//     $("#save_task").click(() => {
//         let title = $("#task_title").val();
//         let description = $("#task_description").val();
//         let assignedTo = $("#task_assigned_to").val();
//         let assignedDate = $("#task_assigned_date").val();
//         let dueDate = $("#task_due_date").val();
//         let clientFeedback = $("#task_client_feedback").val();
//         let nextSteps = $("#task_next_steps").val();
//         let status = $("#task_status").val();
//         let lead = $("#task_lead").val();
//         let opportunity = $("#task_opportunity").val();
//         let activityLog = [];

//         $("#task_activity_log tbody tr").each(function() {
//             let date = $(this).find("input[type='date']").val();
//             let desc = $(this).find("textarea").val();
//             let addedBy = $(this).find("input[type='text']").val();
//             if (date && desc) activityLog.push({ activity_date: date, activity_description: desc, added_by: addedBy });
//         });

//         if (!title || !status) {
//             frappe.msgprint("Task Title and Status are required fields.");
//             return;
//         }

//         frappe.call({
//             method: "frappe.client.insert",
//             args: {
//                 doc: {
//                     doctype: "Custom Task",
//                     task_title: title,
//                     description: description,
//                     assigned_to: assignedTo,
//                     assigned_date: assignedDate,
//                     due_date: dueDate,
//                     client_feedback: clientFeedback,
//                     next_steps: nextSteps,
//                     status: status,
//                     lead: lead,
//                     opportunity: opportunity,
//                     activity_log: activityLog
//                 }
//             },
//             callback: function() {
//                 frappe.msgprint("Task created successfully!");
//                 $("#create_task_modal").hide();
//                 clearTaskForm();
//                 loadTasks("list");
//             },
//             error: function(err) {
//                 console.error("Error creating Task:", err);
//                 frappe.msgprint("Failed to create Task.");
//             }
//         });
//     });

//     function clearTaskForm() {
//         $("#task_title").val("");
//         $("#task_description").val("");
//         $("#task_assigned_to").val("");
//         $("#task_assigned_date").val("");
//         $("#task_due_date").val("");
//         $("#task_client_feedback").val("");
//         $("#task_next_steps").val("");
//         $("#task_status").val("Open");
//         $("#task_lead").val("");
//         $("#task_opportunity").val("");
//         $("#task_activity_log tbody").empty();
//     }

//     $("#add_activity").click(() => {
//         $("#task_activity_log tbody").append(`
//             <tr>
//                 <td><input type="date" class="form-control"></td>
//                 <td><textarea class="form-control"></textarea></td>
//                 <td><input type="text" class="form-control"></td>
//                 <td><button class="btn-blue" onclick="$(this).closest('tr').remove()">Remove</button></td>
//             </tr>
//         `);
//     });

//     // Edit Task (Simple version, can be enhanced)
//     function editTask(taskName) {
//         frappe.call({
//             method: "frappe.client.get",
//             args: { doctype: "Custom Task", name: taskName },
//             callback: function(response) {
//                 let task = response.message;
//                 $("#create_task_modal").show();
//                 $(".modal-header").text("Edit Custom Task");
//                 $("#task_title").val(task.task_title);
//                 $("#task_description").val(task.description);
//                 $("#task_assigned_to").val(task.assigned_to);
//                 $("#task_assigned_date").val(task.assigned_date);
//                 $("#task_due_date").val(task.due_date);
//                 $("#task_client_feedback").val(task.client_feedback);
//                 $("#task_next_steps").val(task.next_steps);
//                 $("#task_status").val(task.status);
//                 $("#task_lead").val(task.lead);
//                 $("#task_opportunity").val(task.opportunity);
//                 $("#task_activity_log tbody").empty();
//                 if (task.activity_log) {
//                     task.activity_log.forEach(log => {
//                         $("#task_activity_log tbody").append(`
//                             <tr>
//                                 <td><input type="date" class="form-control" value="${log.activity_date}"></td>
//                                 <td><textarea class="form-control">${log.activity_description}</textarea></td>
//                                 <td><input type="text" class="form-control" value="${log.added_by}"></td>
//                                 <td><button class="btn-blue" onclick="$(this).closest('tr').remove()">Remove</button></td>
//                             </tr>
//                         `);
//                     });
//                 }
//             },
//             error: function(err) {
//                 console.error("Error loading Task:", err);
//                 frappe.msgprint("Failed to load Task.");
//             }
//         });
//     }

//     // Add Event for Opportunity
//     $("#add_event").click(() => {
//         $("#no_events").hide();
//         $("#add_event_form").show();
//         $("#save_event").show();
//     });

//     $("#cancel_event").click(() => {
//         $("#events_modal").hide();
//         $("#add_event_form").hide();
//         $("#save_event").hide();
//         clearEventForm();
//     });

//     $("#save_event").click(() => {
//         let subject = $("#event_subject").val();
//         let startsOn = $("#event_starts_on").val();
//         let description = $("#event_description").val();
//         let opportunityName = $("#opportunity_name").text();

//         if (!subject || !startsOn) {
//             frappe.msgprint("Subject and Starts On are required fields.");
//             return;
//         }

//         frappe.call({
//             method: "frappe.client.insert",
//             args: {
//                 doc: {
//                     doctype: "Event",
//                     subject: subject,
//                     event_category: "Event",
//                     event_type: "Private",
//                     send_reminder: 1,
//                     starts_on: startsOn,
//                     status: "Open",
//                     description: `<div class="ql-editor read-mode"><p>${description || ''}</p></div>`,
//                     event_participants: [{ reference_doctype: "Opportunity", reference_docname: opportunityName }]
//                 }
//             },
//             callback: function() {
//                 frappe.msgprint("Event created successfully!");
//                 $("#events_modal").hide();
//                 clearEventForm();
//                 loadOpportunities("list");
//             },
//             error: function(err) {
//                 console.error("Error creating Event:", err);
//                 frappe.msgprint("Failed to create Event.");
//             }
//         });
//     });

//     function clearEventForm() {
//         $("#event_subject").val("");
//         $("#event_starts_on").val("");
//         $("#event_description").val("");
//     }

//     // View Toggle for Leads
//     $("#lead_list_view").click(() => {
//         $("#lead_list_view").addClass("active");
//         $("#lead_kanban_view").removeClass("active");
//         $("#lead_list_container").show();
//         $("#lead_kanban_container").hide();
//         loadLeads("list");
//     });

//     $("#lead_kanban_view").click(() => {
//         $("#lead_kanban_view").addClass("active");
//         $("#lead_list_view").removeClass("active");
//         $("#lead_list_container").hide();
//         $("#lead_kanban_container").show();
//         loadLeads("kanban");
//     });

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

//     $("#task_list_view").click(() => {
//         $("#task_list_view").addClass("active");
//         $("#task_kanban_view").removeClass("active");
//         $("#task_list_container").show();
//         $("#task_kanban_container").hide();
//         loadTasks("list");
//     });

//     $("#task_kanban_view").click(() => {
//         $("#task_kanban_view").addClass("active");
//         $("#task_list_view").removeClass("active");
//         $("#task_list_container").hide();
//         $("#task_kanban_container").show();
//         loadTasks("kanban");
//     });

//     // Load Data Initially
//     loadLeads("list");
//     loadOpportunities("list");
//     loadTasks("list");
// }