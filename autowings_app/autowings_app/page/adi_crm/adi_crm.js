// frappe.pages['adi-crm'].on_page_load = function(wrapper) {
//     var page = frappe.ui.make_app_page({
//         parent: wrapper,
//         title: 'Adi CRM',
//         single_column: true
//     });

//     const current_user = frappe.session.user;

//     $(wrapper).html(`
//         <style>
//             body {
//                 background: linear-gradient(to top right, #ffffff);
//                 font-family: sans-serif;
//             }
//             .adi-crm-flex { display: flex; height: 100vh; }
//             .adi-crm-sidebar { width: 240px; background: white; padding: 24px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-top-right-radius: 24px; border-bottom-right-radius: 24px; }
//             .adi-crm-sidebar h2 { color: #fb923c; font-size: 20px; font-weight: bold; margin-bottom: 24px; }
//             .adi-crm-sidebar ul li { margin-bottom: 16px; cursor: pointer; font-weight: 500; color: #374151; }
//             .adi-crm-sidebar ul li:hover, .adi-crm-sidebar ul li.adi-crm-active { color: #fb923c; }
//             .adi-crm-main { flex: 1; padding: 24px; overflow-y: auto; }
//             .adi-crm-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
//             .adi-crm-filters { margin-top: 20px; }
//             .adi-crm-filters button { padding: 8px 16px; margin-right: 12px; border-radius: 9999px; font-weight: 500; border: none; background-color: #fff7ed; color: #fb923c; }
//             .adi-crm-filters button.adi-crm-active { background-color: #fb923c; color: white; }
//             .adi-crm-grid { display: grid; gap: 24px; margin-top: 24px; }
//             .adi-crm-grid-3 { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
//             .adi-crm-card { background: white; padding: 24px; border-radius: 16px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06); text-align: center; }
//             .adi-crm-card h1 { font-size: 36px; font-weight: bold; }
//             .adi-crm-orange { color: #fb923c; }
//             .adi-crm-green { color: #22c55e; }
//             .adi-crm-blue { color: #3b82f6; }
//             .adi-crm-section-title { font-size: 20px; font-weight: 600; margin-bottom: 16px; }
//             .adi-crm-table { width: 100%; border-collapse: collapse; margin-top: 24px; }
//             .adi-crm-table th, .adi-crm-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
//             .adi-crm-table th { background: #fff7ed; color: #fb923c; }
//             .adi-crm-table tr:hover { background: #f9fafb; cursor: pointer; }
//             .adi-crm-date-range { margin-left: 12px; display: inline-block; }
//             .adi-crm-date-range input { padding: 5px; margin-right: 10px; border: 1px solid #e5e7eb; border-radius: 4px; }
//             .adi-crm-date-range button { padding: 8px 16px; border-radius: 9999px; font-weight: 500; border: none; background-color: #fb923c; color: white; }
//         </style>

//         <div class="adi-crm-flex">
//             <div class="adi-crm-sidebar">
//                 <h2>Adi CRM</h2>
//                 <ul>
//                     <li class="adi-crm-active" data-view="dashboard">📊 Dashboard</li>
//                     <li data-view="leads">👥 Leads</li>
//                     <li data-view="opportunities">📈 Opportunities</li>
//                     <li data-view="events">📅 Events</li>
// 					<li data-view="events">📝 Task</li>
//                 </ul>
//             </div>
//             <div class="adi-crm-main" id="adi-crm-content"></div>
//         </div>
//     `);

//     // Render Dashboard
//     function renderDashboard(filterType, dateRange) {
//         $('#adi-crm-content').html(`
//             <div class="adi-crm-top-bar">
//                 <h1 class="text-2xl font-semibold text-gray-800">Dashboard</h1>
//             </div>
//             <div class="adi-crm-filters" id="dashboard-filters">
//                 <button data-filter="today">Today</button>
//                 <button data-filter="yesterday">Yesterday</button>
//                 <button data-filter="weekly">Weekly</button>
//                 <button data-filter="monthly">Monthly</button>
//                 <button data-filter="date-range">Date Range</button>
//                 <span class="adi-crm-date-range" id="date-range-picker"></span>
//             </div>
//             <div class="adi-crm-grid adi-crm-grid-3" id="dashboard-cards"></div>
//             <div class="adi-crm-card mt-6">
//                 <div class="adi-crm-section-title">Goals</div>
//                 <h1 class="adi-crm-orange">$7580</h1>
//                 <p class="text-gray-500">Out of $7000</p>
//             </div>
//             <div class="adi-crm-card mt-6">
//                 <div class="adi-crm-section-title">Upcoming Meetings</div>
//                 <p class="text-gray-700">In 30min: Sam Saltman's Meeting – Sales Team</p>
//             </div>
//         `);

//         $(`#dashboard-filters button[data-filter="${filterType}"]`).addClass('adi-crm-active');
//         if (dateRange) {
//             $(`#dashboard-filters #date-range-picker`).html(`
//                 <input type="date" id="start-date" value="${dateRange.start}" />
//                 <input type="date" id="end-date" value="${dateRange.end}" />
//                 <button id="fetch-date-range">Fetch</button>
//             `);
//         }

//         frappe.call({
//             method: 'autowings_app.custom_scripts.api.get_dashboard_counts',
//             args: { user: current_user, filter_type: filterType, date_range: dateRange },
//             callback: function(r) {
//                 if (r.message) {
//                     $('#dashboard-cards').html(`
//                         <div class="adi-crm-card">
//                             <p class="text-gray-500">New Leads</p>
//                             <h1 class="adi-crm-orange">${r.message.leads}</h1>
//                         </div>
//                         <div class="adi-crm-card">
//                             <p class="text-gray-500">Opportunities</p>
//                             <h1 class="adi-crm-green">${r.message.opportunities}</h1>
//                         </div>
//                         <div class="adi-crm-card">
//                             <p class="text-gray-500">Quotations</p>
//                             <h1 class="adi-crm-blue">${r.message.quotations}</h1>
//                         </div>
//                     `);
//                 }
//             }
//         });

//         setupFilterHandlers('dashboard', filterType, dateRange);
//     }

//     // Render Leads
//     function renderLeads(filterType, dateRange) {
//         $('#adi-crm-content').html(`
//             <div class="adi-crm-top-bar">
//                 <h1 class="text-2xl font-semibold text-gray-800">Leads</h1>
//             </div>
//             <div class="adi-crm-filters" id="leads-filters">
//                 <button data-filter="today">Today</button>
//                 <button data-filter="yesterday">Yesterday</button>
//                 <button data-filter="weekly">Weekly</button>
//                 <button data-filter="monthly">Monthly</button>
//                 <button data-filter="date-range">Date Range</button>
//                 <span class="adi-crm-date-range" id="date-range-picker"></span>
//             </div>
//             <table class="adi-crm-table">
//                 <thead>
//                     <tr>
//                         <th>ID</th>
//                         <th>Lead Name</th>
//                         <th>Status</th>
//                         <th>Updated Date</th>
//                     </tr>
//                 </thead>
//                 <tbody id="leads-table-body"></tbody>
//             </table>
//         `);

//         $(`#leads-filters button[data-filter="${filterType}"]`).addClass('adi-crm-active');
//         if (dateRange) {
//             $(`#leads-filters #date-range-picker`).html(`
//                 <input type="date" id="start-date" value="${dateRange.start}" />
//                 <input type="date" id="end-date" value="${dateRange.end}" />
//                 <button id="fetch-date-range">Fetch</button>
//             `);
//         }

//         frappe.call({
//             method: 'autowings_app.custom_scripts.api.get_leads',
//             args: { user: current_user, filter_type: filterType, date_range: dateRange },
//             callback: function(r) {
//                 if (r.message) {
//                     r.message.forEach(lead => {
//                         $('#leads-table-body').append(`
//                             <tr data-lead="${lead.name}">
//                                 <td>${lead.name}</td>
//                                 <td>${lead.lead_name}</td>
//                                 <td>${lead.status}</td>
//                                 <td>${frappe.datetime.str_to_user(lead.modified)}</td>
//                             </tr>
//                         `);
//                     });
//                     $('#leads-table-body tr').click(function() {
//                         const leadName = $(this).data('lead');
//                         frappe.set_route('lead', leadName);
//                     });
//                 }
//             }
//         });

//         setupFilterHandlers('leads', filterType, dateRange);
//     }

//     // Render Opportunities
//     function renderOpportunities(filterType, dateRange) {
//         $('#adi-crm-content').html(`
//             <div class="adi-crm-top-bar">
//                 <h1 class="text-2xl font-semibold text-gray-800">Opportunities</h1>
//             </div>
//             <div class="adi-crm-filters" id="opportunities-filters">
//                 <button data-filter="today">Today</button>
//                 <button data-filter="yesterday">Yesterday</button>
//                 <button data-filter="weekly">Weekly</button>
//                 <button data-filter="monthly">Monthly</button>
//                 <button data-filter="date-range">Date Range</button>
//                 <span class="adi-crm-date-range" id="date-range-picker"></span>
//             </div>
//             <table class="adi-crm-table">
//                 <thead>
//                     <tr>
//                         <th>ID</th>
//                         <th>Opportunity Name</th>
//                         <th>Status</th>
//                         <th>Updated Date</th>
//                     </tr>
//                 </thead>
//                 <tbody id="opportunities-table-body"></tbody>
//             </table>
//         `);

//         $(`#opportunities-filters button[data-filter="${filterType}"]`).addClass('adi-crm-active');
//         if (dateRange) {
//             $(`#opportunities-filters #date-range-picker`).html(`
//                 <input type="date" id="start-date" value="${dateRange.start}" />
//                 <input type="date" id="end-date" value="${dateRange.end}" />
//                 <button id="fetch-date-range">Fetch</button>
//             `);
//         }

//         frappe.call({
//             method: 'autowings_app.custom_scripts.api.get_opportunities',
//             args: { user: current_user, filter_type: filterType, date_range: dateRange },
//             callback: function(r) {
//                 if (r.message) {
//                     r.message.forEach(opp => {
//                         $('#opportunities-table-body').append(`
//                             <tr data-opportunity="${opp.name}">
//                                 <td>${opp.name}</td>
//                                 <td>${opp.title}</td>
//                                 <td>${opp.status}</td>
//                                 <td>${frappe.datetime.str_to_user(opp.modified)}</td>
//                             </tr>
//                         `);
//                     });
//                     $('#opportunities-table-body tr').click(function() {
//                         const oppName = $(this).data('opportunity');
//                         frappe.set_route('opportunity', oppName);
//                     });
//                 }
//             }
//         });

//         setupFilterHandlers('opportunities', filterType, dateRange);
//     }

//     // Render Events
//     function renderEvents(filterType, dateRange) {
//         $('#adi-crm-content').html(`
//             <div class="adi-crm-top-bar">
//                 <h1 class="text-2xl font-semibold text-gray-800">Events</h1>
//             </div>
//             <div class="adi-crm-filters" id="events-filters">
//                 <button data-filter="today">Today</button>
//                 <button data-filter="yesterday">Yesterday</button>
//                 <button data-filter="weekly">Weekly</button>
//                 <button data-filter="monthly">Monthly</button>
//                 <button data-filter="date-range">Date Range</button>
//                 <span class="adi-crm-date-range" id="date-range-picker"></span>
//             </div>
//             <table class="adi-crm-table">
//                 <thead>
//                     <tr>
//                         <th>ID</th>
//                         <th>Subject</th>
//                         <th>Description</th>
//                         <th>Start Date</th>
//                         <th>Status</th>
//                     </tr>
//                 </thead>
//                 <tbody id="events-table-body"></tbody>
//             </table>
//         `);

//         $(`#events-filters button[data-filter="${filterType}"]`).addClass('adi-crm-active');
//         if (dateRange) {
//             $(`#events-filters #date-range-picker`).html(`
//                 <input type="date" id="start-date" value="${dateRange.start}" />
//                 <input type="date" id="end-date" value="${dateRange.end}" />
//                 <button id="fetch-date-range">Fetch</button>
//             `);
//         }

//         frappe.call({
//             method: 'autowings_app.custom_scripts.api.get_events',
//             args: { user: current_user, filter_type: filterType, date_range: dateRange },
//             callback: function(r) {
//                 if (r.message) {
//                     r.message.forEach(event => {
//                         $('#events-table-body').append(`
//                             <tr data-event="${event.name}">
//                                 <td>${event.name}</td>
//                                 <td>${event.subject}</td>
//                                 <td>${event.description || ''}</td>
//                                 <td>${frappe.datetime.str_to_user(event.starts_on)}</td>
//                                 <td>${event.status}</td>
//                             </tr>
//                         `);
//                     });
//                     $('#events-table-body tr').click(function() {
//                         const eventName = $(this).data('event');
//                         frappe.set_route('event', eventName);
//                     });
//                 }
//             }
//         });

//         setupFilterHandlers('events', filterType, dateRange);
//     }

//     // Setup Filter Handlers
//     function setupFilterHandlers(view, currentFilter, dateRange) {
//         $('#adi-crm-content').off('click', '.adi-crm-filters button').on('click', '.adi-crm-filters button', function() {
//             const $this = $(this);
//             const filterType = $this.data('filter');

//             $(`#${view}-filters button`).removeClass('adi-crm-active');
//             $this.addClass('adi-crm-active');

//             if (filterType === 'date-range') {
//                 $(`#${view}-filters #date-range-picker`).html(`
//                     <input type="date" id="start-date" value="${dateRange ? dateRange.start : ''}" />
//                     <input type="date" id="end-date" value="${dateRange ? dateRange.end : ''}" />
//                     <button id="fetch-date-range">Fetch</button>
//                 `);

//                 $(`#${view}-filters #fetch-date-range`).click(function() {
//                     const startDate = $(`#${view}-filters #start-date`).val();
//                     const endDate = $(`#${view}-filters #end-date`).val();
//                     if (startDate && endDate) {
//                         const newDateRange = { start: startDate, end: endDate };
//                         if (view === 'dashboard') renderDashboard(filterType, newDateRange);
//                         else if (view === 'leads') renderLeads(filterType, newDateRange);
//                         else if (view === 'opportunities') renderOpportunities(filterType, newDateRange);
//                         else if (view === 'events') renderEvents(filterType, newDateRange);
//                     } else {
//                         frappe.msgprint('Please select both start and end dates.');
//                     }
//                 });
//             } else {
//                 $(`#${view}-filters #date-range-picker`).empty();
//                 if (view === 'dashboard') renderDashboard(filterType);
//                 else if (view === 'leads') renderLeads(filterType);
//                 else if (view === 'opportunities') renderOpportunities(filterType);
//                 else if (view === 'events') renderEvents(filterType);
//             }
//         });
//     }

//     // Sidebar Navigation
//     $('.adi-crm-sidebar li').click(function() {
//         $('.adi-crm-sidebar li').removeClass('adi-crm-active');
//         $(this).addClass('adi-crm-active');
//         const view = $(this).data('view');
//         if (view === 'dashboard') renderDashboard('monthly');
//         else if (view === 'leads') renderLeads('monthly');
//         else if (view === 'opportunities') renderOpportunities('monthly');
//         else if (view === 'events') renderEvents('monthly');
//     });

//     // Initial render
//     renderDashboard('monthly');
// };

frappe.pages['adi-crm'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Adi CRM',
        single_column: true
    });

    const current_user = frappe.session.user;

    $(wrapper).html(`
        <style>
            body {
                background: linear-gradient(to top right, #ffffff);
                font-family: sans-serif;
                margin: 0;
                padding: 0;
            }
            .adi-crm-flex { 
                display: flex; 
                height: 100vh; 
                position: relative; 
            }
            .adi-crm-sidebar { 
                width: 240px; 
                background: white; 
                padding: 24px; 
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
                border-top-right-radius: 24px; 
                border-bottom-right-radius: 24px; 
                transition: transform 0.3s ease; 
                position: fixed; 
                height: 100%; 
                z-index: 1000; 
            }
            .adi-crm-sidebar-collapsed {
                transform: translateX(-100%);
            }
            .adi-crm-sidebar-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
            }
            .adi-crm-sidebar h2 { 
                color: #fb923c; 
                font-size: 20px; 
                font-weight: bold; 
                margin: 0; 
            }
            .adi-crm-sidebar ul li { 
                margin-bottom: 16px; 
                cursor: pointer; 
                font-weight: 500; 
                color: #374151; 
            }
            .adi-crm-sidebar ul li:hover, 
            .adi-crm-sidebar ul li.adi-crm-active { 
                color: #fb923c; 
            }
            .adi-crm-main { 
                flex: 1; 
                padding: 24px; 
                overflow-y: auto; 
                margin-left: 240px; 
                transition: margin-left 0.3s ease; 
            }
            .adi-crm-main-full {
                margin-left: 0;
            }
            .adi-crm-top-bar { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin-bottom: 24px; 
            }
            .adi-crm-top-bar .hamburger-menu-top {
                display: none;
                font-size: 24px;
                cursor: pointer;
                color: #fb923c;
                margin-right: 16px;
            }
            .adi-crm-filters { 
                margin-top: 20px; 
                display: flex; 
                align-items: center; 
                flex-wrap: wrap; 
                gap: 10px; 
            }
            .adi-crm-filters button { 
                padding: 8px 16px; 
                border-radius: 9999px; 
                font-weight: 500; 
                border: none; 
                background-color: #fff7ed; 
                color: #fb923c; 
            }
            .adi-crm-filters button.adi-crm-active { 
                background-color: #fb923c; 
                color: white; 
            }
            .adi-crm-grid { 
                display: grid; 
                gap: 24px; 
                margin-top: 24px; 
            }
            .adi-crm-grid-3 { 
                grid-template-columns: repeat(5, 1fr); 
            }
            .adi-crm-card { 
                background: white; 
                padding: 24px; 
                border-radius: 16px; 
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06); 
                text-align: center; 
            }
            .adi-crm-card h1 { 
                font-size: 36px; 
                font-weight: bold; 
            }
            .adi-crm-orange { 
                color: #fb923c; 
            }
            .adi-crm-green { 
                color: #22c55e; 
            }
            .adi-crm-blue { 
                color: #3b82f6; 
            }
            .adi-crm-section-title { 
                font-size: 20px; 
                font-weight: 600; 
                margin-bottom: 16px; 
            }
            .adi-crm-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 24px; 
            }
            .adi-crm-table th, 
            .adi-crm-table td { 
                padding: 12px; 
                text-align: left; 
                border-bottom: 1px solid #e5e7eb; 
            }
            .adi-crm-table th { 
                background: #fff7ed; 
                color: #fb923c; 
            }
            .adi-crm-table tr:hover { 
                background: #f9fafb; 
                cursor: pointer; 
            }
            .adi-crm-date-range { 
                margin-left: 12px; 
                display: inline-flex; 
                align-items: center; 
                gap: 10px; 
            }
            .adi-crm-date-range input { 
                padding: 5px; 
                border: 1px solid #e5e7eb; 
                border-radius: 4px; 
            }
            .adi-crm-date-range button { 
                padding: 8px 16px; 
                border-radius: 9999px; 
                font-weight: 500; 
                border: none; 
                background-color: #fb923c; 
                color: white; 
            }
            .adi-crm-modal { 
                position: fixed; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                background: rgba(0,0,0,0.5); 
                display: none; 
                justify-content: center; 
                align-items: center; 
                z-index: 2000; 
            }
            .adi-crm-modal-content { 
                background: white; 
                padding: 24px; 
                border-radius: 12px; 
                width: 90%; 
                max-width: 600px; 
                max-height: 80vh; 
                overflow-y: auto; 
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2); 
                text-align: left; 
                animation: slideIn 0.3s ease-out; 
            }
            @keyframes slideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .modal-header { 
                font-size: 24px; 
                font-weight: bold; 
                color: #fb923c; 
                margin-bottom: 20px; 
                border-bottom: 1px solid #e5e7eb; 
                padding-bottom: 10px; 
            }
            .modal-body .form-grid { 
                display: grid; 
                gap: 20px; 
                grid-template-columns: repeat(2, 1fr); 
            }
            .modal-body label { 
                font-size: 14px; 
                color: #374151; 
                font-weight: 500; 
                display: block; 
                margin-bottom: 5px; 
            }
            .modal-body input, 
            .modal-body select { 
                width: 100%; 
                padding: 10px; 
                border: 1px solid #e5e7eb; 
                border-radius: 6px; 
                font-size: 14px; 
                transition: border-color 0.3s; 
            }
            .modal-body input:focus, 
            .modal-body select:focus { 
                border-color: #fb923c; 
                outline: none; 
            }
            .modal-footer { 
                margin-top: 20px; 
                text-align: right; 
            }
            .adi-crm-create-btn {
                padding: 8px 20px; 
                border-radius: 6px; 
                background: #fb923c; 
                color: white; 
                border: none; 
                cursor: pointer; 
                margin-left: 10px; 
                font-weight: 500; 
                transition: background 0.3s;
            }
            .adi-crm-create-btn:hover { 
                background: #f97316; 
            }
            .adi-crm-search { 
                margin-left: 12px; 
                padding: 5px; 
                border: 1px solid #e5e7eb; 
                border-radius: 4px; 
                width: 200px; 
            }
            .adi-crm-status-filter { 
                padding: 5px; 
                border: 1px solid #e5e7eb; 
                border-radius: 4px; 
            }
            .task-event-container {
                display: flex;
                justify-content: space-between;
                gap: 24px;
                margin-top: 24px;
            }
            .task-event-section {
                flex: 1;
                background: white;
                padding: 24px;
                border-radius: 16px;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
            }
            .task-event-card {
                background: #f9fafb;
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 12px;
                transition: transform 0.2s;
                cursor: pointer;
            }
            .task-event-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .task-event-card h4 {
                margin: 0 0 8px;
                font-size: 16px;
                color: #374151;
            }
            .task-event-card p {
                margin: 4px 0;
                font-size: 14px;
                color: #6b7280;
            }
            .task-event-card .status {
                font-weight: 500;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
            }
            .task-event-card .status-open {
                background: #e0f2fe;
                color: #0369a1;
            }
            .task-event-card .status-closed {
                background: #dcfce7;
                color: #15803d;
            }
            .hamburger-menu {
                display: none;
                position: fixed;
                top: 40px;
                left: 16px;
                z-index: 1100;
                font-size: 24px;
                cursor: pointer;
                color: #fb923c;
            }
            .collapse-icon {
                font-size: 20px;
                cursor: pointer;
                color: #fb923c;
                display: block;
            }
            .see-more-btn {
                display: block;
                margin: 12px auto;
                padding: 8px 16px;
                border-radius: 9999px;
                background: #fb923c;
                color: white;
                border: none;
                cursor: pointer;
                text-align: center;
                font-weight: 500;
            }
            .see-more-btn:hover {
                background: #f97316;
            }

            @media (max-width: 768px) {
                .adi-crm-sidebar {
                    transform: translateX(-100%);
                }
                .adi-crm-sidebar-visible {
                    transform: translateX(0);
                }
                .adi-crm-main {
                    margin-left: 0;
                }
                .adi-crm-grid-3 {
                    grid-template-columns: repeat(2, 1fr);
                }
                .task-event-container {
                    flex-direction: column;
                }
                .hamburger-menu {
                    display: block !important;
                }
                .hamburger-menu-top {
                    display: inline-block !important;
                }
                .modal-body .form-grid {
                    grid-template-columns: 1fr;
                }
                .collapse-icon {
                    display: block;
                }
            }

            @media (max-width: 480px) {
                .adi-crm-grid-3 {
                    grid-template-columns: 1fr;
                }
                .adi-crm-table th, .adi-crm-table td {
                    padding: 8px;
                    font-size: 14px;
                }
                .adi-crm-search {
                    width: 150px;
                }
            }
        </style>

        <div class="hamburger-menu" id="hamburger-menu">☰</div>
        <div class="adi-crm-flex">
            <div class="adi-crm-sidebar" id="adi-crm-sidebar">
                <div class="adi-crm-sidebar-header">
                    <h2>Adi CRM</h2>
                    <span class="collapse-icon" id="collapse-icon">⬅️</span>
                </div>
                <ul>
                    <li class="adi-crm-active" data-view="dashboard">📊 Dashboard</li>
                    <li data-view="leads">👥 Leads</li>
                    <li data-view="opportunities">📈 Opportunities</li>
                    <li data-view="events">📅 Events</li>
                    <li data-view="tasks">✅ Tasks</li>
                </ul>
            </div>
            <div class="adi-crm-main" id="adi-crm-main">
                <div id="adi-crm-content"></div>
            </div>
            <div class="adi-crm-modal" id="adi-crm-modal">
                <div class="adi-crm-modal-content" id="adi-crm-modal-content"></div>
            </div>
        </div>
    `);

    function toggleSidebar() {
        const $sidebar = $('#adi-crm-sidebar');
        const $main = $('#adi-crm-main');
        const $hamburger = $('#hamburger-menu');
        const $collapseIcon = $('#collapse-icon');
        const isCollapsed = $sidebar.hasClass('adi-crm-sidebar-collapsed');

        $sidebar.toggleClass('adi-crm-sidebar-collapsed adi-crm-sidebar-visible');
        $main.toggleClass('adi-crm-main-full');
        $collapseIcon.text(isCollapsed ? '⬅️' : '➡️');

        // Show hamburger menu immediately after collapse on all screens
        $hamburger.show();

        // Hide top bar hamburger on desktop when sidebar is visible
        if ($(window).width() > 768 && !isCollapsed) {
            $('.hamburger-menu-top').hide();
        } else {
            $('.hamburger-menu-top').show();
        }
    }

    $('#hamburger-menu').click(toggleSidebar);
    $('#collapse-icon').click(toggleSidebar);

    function showModal(content) {
        $('#adi-crm-modal-content').html(content);
        $('#adi-crm-modal').show();
    }

    $('#adi-crm-modal').click(function(e) {
        if (e.target === this) $('#adi-crm-modal').hide();
    });

    function setupRowHandlers() {
        $('.adi-crm-view-btn').click(function() {
            const type = $(this).data('type');
            const ref = $(this).data('ref');
            frappe.call({
                method: 'autowings_app.custom_scripts.api.get_related_items',
                args: { 
                    reference_name: ref,
                    item_type: type
                },
                callback: function(r) {
                    if (r.message) {
                        let html = `<h3>${type === 'events' ? 'Events' : 'Tasks'}</h3>`;
                        if (r.message.length > 0) {
                            html += '<ul>';
                            r.message.forEach(item => {
                                html += `
                                    <li style="margin: 10px 0;">
                                        ${type === 'events' ? 
                                            `${item.subject} - ${frappe.datetime.str_to_user(item.starts_on)} (${item.status})` :
                                            `${item.description} - ${item.date} (${item.status})`}
                                    </li>`;
                            });
                            html += '</ul>';
                        } else {
                            html += '<p>No items found</p>';
                        }
                        showModal(html);
                    }
                }
            });
        });

        $('.adi-crm-create-btn').click(function() {
            frappe.call({
                method: 'autowings_app.custom_scripts.api.get_lead_sources',
                callback: function(r) {
                    let sourceOptions = r.message.map(source => `<option value="${source.name}">${source.name}</option>`).join('');
                    showModal(`
                        <div class="modal-header">New Lead</div>
                        <div class="modal-body">
                            <div class="form-grid">
                                <div><label>First Name *</label><input type="text" id="lead_first_name" placeholder="First Name" required></div>
                                <div><label>Middle Name</label><input type="text" id="lead_middle_name" placeholder="Middle Name"></div>
                                <div><label>Last Name</label><input type="text" id="lead_last_name" placeholder="Last Name"></div>
                                <div><label>Gender</label><select id="lead_gender"><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                                <div><label>Source</label><select id="lead_source"><option value="">Select Source</option>${sourceOptions}</select></div>
                                <div><label>Status *</label><select id="lead_status"><option value="Lead">Lead</option><option value="Open">Open</option><option value="Replied">Replied</option><option value="Opportunity">Opportunity</option><option value="Quotation">Quotation</option><option value="Lost Quotation">Lost Quotation</option><option value="Interested">Interested</option><option value="Converted">Converted</option><option value="Do Not Contact">Do Not Contact</option></select></div>
                                <div><label>Email</label><input type="email" id="lead_email" placeholder="Email"></div>
                                <div><label>Mobile No</label><input type="text" id="lead_mobile_no" placeholder="Mobile No"></div>
                                <div><label>City</label><input type="text" id="lead_city" placeholder="City" value="Ranchi"></div>
                                <div><label>State</label><input type="text" id="lead_state" placeholder="State" value="Jharkhand"></div>
                                <div><label>Area</label><input type="text" id="lead_area" placeholder="Enter Area"></div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button id="cancel_lead" class="adi-crm-create-btn">Cancel</button>
                            <button id="save_lead" class="adi-crm-create-btn">Save</button>
                        </div>
                    `);

                    $('#cancel_lead').click(function() {
                        $('#adi-crm-modal').hide();
                        clearLeadForm();
                    });

                    $('#save_lead').click(function() {
                        let firstName = $('#lead_first_name').val();
                        let middleName = $('#lead_middle_name').val();
                        let lastName = $('#lead_last_name').val();
                        let gender = $('#lead_gender').val();
                        let source = $('#lead_source').val();
                        let status = $('#lead_status').val();
                        let email = $('#lead_email').val();
                        let mobileNo = $('#lead_mobile_no').val();
                        let city = $('#lead_city').val();
                        let state = $('#lead_state').val();
                        let area = $('#lead_area').val();

                        if (!firstName || !status) {
                            frappe.msgprint('First Name and Status are required fields.');
                            return;
                        }

                        let leadName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName || ''}`.trim() || firstName;

                        frappe.call({
                            method: 'autowings_app.custom_scripts.api.create_lead',
                            args: {
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
                                area: area,
                                country: 'India',
                                company: 'Autowings',
                                lead_owner: current_user
                            },
                            callback: function(response) {
                                if (response.message) {
                                    frappe.msgprint('Lead created successfully!');
                                    $('#adi-crm-modal').hide();
                                    clearLeadForm();
                                    renderLeads('monthly');
                                } else {
                                    frappe.msgprint('Error creating lead.');
                                }
                            }
                        });
                    });
                }
            });
        });

        $(document).on('click', '.hamburger-menu-top', toggleSidebar);
    }

    function clearLeadForm() {
        $('#lead_first_name').val('');
        $('#lead_middle_name').val('');
        $('#lead_last_name').val('');
        $('#lead_gender').val('');
        $('#lead_source').val('');
        $('#lead_status').val('Lead');
        $('#lead_email').val('');
        $('#lead_mobile_no').val('');
        $('#lead_city').val('Ranchi');
        $('#lead_state').val('Jharkhand');
        $('#lead_area').val('');
    }

    function filterTableByStatus(view, status) {
        $(`#${view}-table-body tr`).each(function() {
            let rowStatus;
            if (view === 'events') {
                rowStatus = $(this).find('td:nth-child(5)').text();
            } else if (view === 'leads' || view === 'opportunities') {
                rowStatus = $(this).find('td:nth-child(3)').text();
            } else if (view === 'tasks') {
                rowStatus = $(this).find('td:nth-child(3)').text();
            }
            if (status === 'All' || rowStatus === status) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    }

    function renderDashboard(filterType, dateRange) {
        $('#adi-crm-content').html(`
            <div class="adi-crm-top-bar">
                <h1 class="text-2xl font-semibold text-gray-800">Dashboard</h1>
            </div>
            <div class="adi-crm-filters" id="dashboard-filters">
                <button data-filter="today">Today</button>
                <button data-filter="yesterday">Yesterday</button>
                <button data-filter="weekly">Weekly</button>
                <button data-filter="monthly">Monthly</button>
                <button data-filter="date-range">Date Range</button>
                <span class="adi-crm-date-range" id="date-range-picker"></span>
            </div>
            <div class="adi-crm-grid adi-crm-grid-3" id="dashboard-cards"></div>
            <div class="task-event-container">
                <div class="task-event-section">
                    <div class="adi-crm-section-title">Upcoming Tasks (Open)</div>
                    <div id="upcoming-tasks"></div>
                </div>
                <div class="task-event-section">
                    <div class="adi-crm-section-title">Upcoming Events (Open)</div>
                    <div id="upcoming-events"></div>
                </div>
            </div>
        `);

        $(`#dashboard-filters button[data-filter="${filterType}"]`).addClass('adi-crm-active');
        if (dateRange) {
            $(`#dashboard-filters #date-range-picker`).html(`
                <input type="date" id="start-date" value="${dateRange.start}" />
                <input type="date" id="end-date" value="${dateRange.end}" />
                <button id="fetch-date-range">Fetch</button>
            `);
        }

        frappe.call({
            method: 'autowings_app.custom_scripts.api.get_dashboard_counts',
            args: { user: current_user, filter_type: filterType, date_range: dateRange },
            callback: function(r) {
                if (r.message) {
                    $('#dashboard-cards').html(`
                        <div class="adi-crm-card">
                            <p class="text-gray-500">New Leads</p>
                            <h1 class="adi-crm-orange">${r.message.leads}</h1>
                        </div>
                        <div class="adi-crm-card">
                            <p class="text-gray-500">Opportunities</p>
                            <h1 class="adi-crm-green">${r.message.opportunities}</h1>
                        </div>
                        <div class="adi-crm-card">
                            <p class="text-gray-500">Quotations</p>
                            <h1 class="adi-crm-blue">${r.message.quotations}</h1>
                        </div>
                        <div class="adi-crm-card">
                            <p class="text-gray-500">Open Events</p>
                            <h1 class="adi-crm-orange">${r.message.events}</h1>
                        </div>
                        <div class="adi-crm-card">
                            <p class="text-gray-500">Open Tasks</p>
                            <h1 class="adi-crm-green">${r.message.tasks}</h1>
                        </div>
                    `);
                }
            }
        });

        frappe.call({
            method: 'autowings_app.custom_scripts.api.get_upcoming_tasks',
            args: { user: current_user, filter_type: filterType, date_range: dateRange },
            callback: function(r) {
                if (r.message) {
                    let html = '';
                    const limitedTasks = r.message.slice(0, 5);
                    limitedTasks.forEach(task => {
                        html += `
                            <div class="task-event-card" data-task="${task.name}">
                                <h4>${task.description}</h4>
                                <p>Due: ${frappe.datetime.str_to_user(task.date)}</p>
                                <p><span class="status status-${task.status.toLowerCase()}">${task.status}</span></p>
                            </div>
                        `;
                    });
                    if (r.message.length > 5) {
                        html += `<button class="see-more-btn" data-view="tasks">See More</button>`;
                    }
                    $('#upcoming-tasks').html(html || '<p>No upcoming open tasks</p>');

                    $('#upcoming-tasks .task-event-card').click(function() {
                        const taskName = $(this).data('task');
                        frappe.set_route('todo', taskName);
                    });
                    $('#upcoming-tasks .see-more-btn').click(function() {
                        $('.adi-crm-sidebar li[data-view="tasks"]').click();
                    });
                }
            }
        });

        frappe.call({
            method: 'autowings_app.custom_scripts.api.get_upcoming_events',
            args: { user: current_user, filter_type: filterType, date_range: dateRange },
            callback: function(r) {
                if (r.message) {
                    let html = '';
                    const limitedEvents = r.message.slice(0, 5);
                    limitedEvents.forEach(event => {
                        html += `
                            <div class="task-event-card" data-event="${event.name}">
                                <h4>${event.subject}</h4>
                                <p>Starts: ${frappe.datetime.str_to_user(event.starts_on)}</p>
                                <p><span class="status status-${event.status.toLowerCase()}">${event.status}</span></p>
                            </div>
                        `;
                    });
                    if (r.message.length > 5) {
                        html += `<button class="see-more-btn" data-view="events">See More</button>`;
                    }
                    $('#upcoming-events').html(html || '<p>No upcoming open events</p>');

                    $('#upcoming-events .task-event-card').click(function() {
                        const eventName = $(this).data('event');
                        frappe.set_route('event', eventName);
                    });
                    $('#upcoming-events .see-more-btn').click(function() {
                        $('.adi-crm-sidebar li[data-view="events"]').click();
                    });
                }
            }
        });

        setupFilterHandlers('dashboard', filterType, dateRange);
    }

    function renderLeads(filterType, dateRange) {
        $('#adi-crm-content').html(`
            <div class="adi-crm-top-bar">
                <h1 class="text-2xl font-semibold text-gray-800">Leads</h1>
                <button class="adi-crm-create-btn">Create Lead</button>
            </div>
            <div class="adi-crm-filters" id="leads-filters">
                <button data-filter="today">Today</button>
                <button data-filter="yesterday">Yesterday</button>
                <button data-filter="weekly">Weekly</button>
                <button data-filter="monthly">Monthly</button>
                <button data-filter="date-range">Date Range</button>
                <span class="adi-crm-date-range" id="date-range-picker"></span>
                <input type="text" class="adi-crm-search" id="leads-search" placeholder="Search by ID or Name">
            </div>
            <table class="adi-crm-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Lead Name</th>
                        <th><select class="adi-crm-status-filter" id="leads-status-filter"><option value="All">All Status</option></select></th>
                        <th>Updated Date</th>
                    </tr>
                </thead>
                <tbody id="leads-table-body"></tbody>
            </table>
        `);

        $(`#leads-filters button[data-filter="${filterType}"]`).addClass('adi-crm-active');
        if (dateRange) {
            $(`#leads-filters #date-range-picker`).html(`
                <input type="date" id="start-date" value="${dateRange.start}" />
                <input type="date" id="end-date" value="${dateRange.end}" />
                <button id="fetch-date-range">Fetch</button>
            `);
        }

        frappe.call({
            method: 'autowings_app.custom_scripts.api.get_leads',
            args: { user: current_user, filter_type: filterType, date_range: dateRange },
            callback: function(r) {
                if (r.message) {
                    const statusSet = new Set(r.message.map(lead => lead.status));
                    statusSet.forEach(status => {
                        $('#leads-status-filter').append(`<option value="${status}">${status}</option>`);
                    });

                    r.message.forEach(lead => {
                        $('#leads-table-body').append(`
                            <tr data-lead="${lead.name}">
                                <td>${lead.name}</td>
                                <td>${lead.lead_name}</td>
                                <td>${lead.status}</td>
                                <td>${frappe.datetime.str_to_user(lead.modified)}</td>
                            </tr>
                        `);
                    });

                    $('#leads-table-body tr').click(function(e) {
                        const leadName = $(this).data('lead');
                        frappe.set_route('lead', leadName);
                    });

                    $('#leads-search').on('input', function() {
                        const search = $(this).val().toLowerCase();
                        $('#leads-table-body tr').each(function() {
                            const id = $(this).find('td:nth-child(1)').text().toLowerCase();
                            const name = $(this).find('td:nth-child(2)').text().toLowerCase();
                            $(this).toggle(id.includes(search) || name.includes(search));
                        });
                    });

                    $('#leads-status-filter').change(function() {
                        filterTableByStatus('leads', $(this).val());
                    });
                }
            }
        });

        setupFilterHandlers('leads', filterType, dateRange);
        setupRowHandlers();
    }

    function renderOpportunities(filterType, dateRange) {
        $('#adi-crm-content').html(`
            <div class="adi-crm-top-bar">
                <h1 class="text-2xl font-semibold text-gray-800">Opportunities</h1>
            </div>
            <div class="adi-crm-filters" id="opportunities-filters">
                <button data-filter="today">Today</button>
                <button data-filter="yesterday">Yesterday</button>
                <button data-filter="weekly">Weekly</button>
                <button data-filter="monthly">Monthly</button>
                <button data-filter="date-range">Date Range</button>
                <span class="adi-crm-date-range" id="date-range-picker"></span>
                <input type="text" class="adi-crm-search" id="opportunities-search" placeholder="Search by ID or Name">
            </div>
            <table class="adi-crm-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Opportunity Name</th>
                        <th><select class="adi-crm-status-filter" id="opportunities-status-filter"><option value="All">All Status</option></select></th>
                        <th>Updated Date</th>
                    </tr>
                </thead>
                <tbody id="opportunities-table-body"></tbody>
            </table>
        `);

        $(`#opportunities-filters button[data-filter="${filterType}"]`).addClass('adi-crm-active');
        if (dateRange) {
            $(`#opportunities-filters #date-range-picker`).html(`
                <input type="date" id="start-date" value="${dateRange.start}" />
                <input type="date" id="end-date" value="${dateRange.end}" />
                <button id="fetch-date-range">Fetch</button>
            `);
        }

        frappe.call({
            method: 'autowings_app.custom_scripts.api.get_opportunities',
            args: { user: current_user, filter_type: filterType, date_range: dateRange },
            callback: function(r) {
                if (r.message) {
                    const statusSet = new Set(r.message.map(opp => opp.status));
                    statusSet.forEach(status => {
                        $('#opportunities-status-filter').append(`<option value="${status}">${status}</option>`);
                    });

                    r.message.forEach(opp => {
                        $('#opportunities-table-body').append(`
                            <tr data-opportunity="${opp.name}">
                                <td>${opp.name}</td>
                                <td>${opp.title}</td>
                                <td>${opp.status}</td>
                                <td>${frappe.datetime.str_to_user(opp.modified)}</td>
                            </tr>
                        `);
                    });

                    $('#opportunities-table-body tr').click(function(e) {
                        const oppName = $(this).data('opportunity');
                        frappe.set_route('opportunity', oppName);
                    });

                    $('#opportunities-search').on('input', function() {
                        const search = $(this).val().toLowerCase();
                        $('#opportunities-table-body tr').each(function() {
                            const id = $(this).find('td:nth-child(1)').text().toLowerCase();
                            const name = $(this).find('td:nth-child(2)').text().toLowerCase();
                            $(this).toggle(id.includes(search) || name.includes(search));
                        });
                    });

                    $('#opportunities-status-filter').change(function() {
                        filterTableByStatus('opportunities', $(this).val());
                    });
                }
            }
        });

        setupFilterHandlers('opportunities', filterType, dateRange);
    }

    function renderEvents(filterType, dateRange) {
        $('#adi-crm-content').html(`
            <div class="adi-crm-top-bar">
                <h1 class="text-2xl font-semibold text-gray-800">Events</h1>
            </div>
            <div class="adi-crm-filters" id="events-filters">
                <button data-filter="today">Today</button>
                <button data-filter="yesterday">Yesterday</button>
                <button data-filter="weekly">Weekly</button>
                <button data-filter="monthly">Monthly</button>
                <button data-filter="date-range">Date Range</button>
                <span class="adi-crm-date-range" id="date-range-picker"></span>
                <input type="text" class="adi-crm-search" id="events-search" placeholder="Search by ID or Subject">
            </div>
            <table class="adi-crm-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Subject</th>
                        <th>Description</th>
                        <th>Start Date</th>
                        <th><select class="adi-crm-status-filter" id="events-status-filter"><option value="All">All Status</option></select></th>
                    </tr>
                </thead>
                <tbody id="events-table-body"></tbody>
            </table>
        `);

        $(`#events-filters button[data-filter="${filterType}"]`).addClass('adi-crm-active');
        if (dateRange) {
            $(`#events-filters #date-range-picker`).html(`
                <input type="date" id="start-date" value="${dateRange.start}" />
                <input type="date" id="end-date" value="${dateRange.end}" />
                <button id="fetch-date-range">Fetch</button>
            `);
        }

        frappe.call({
            method: 'autowings_app.custom_scripts.api.get_events',
            args: { user: current_user, filter_type: filterType, date_range: dateRange },
            callback: function(r) {
                if (r.message) {
                    const statusSet = new Set(r.message.map(event => event.status));
                    statusSet.forEach(status => {
                        $('#events-status-filter').append(`<option value="${status}">${status}</option>`);
                    });

                    r.message.forEach(event => {
                        $('#events-table-body').append(`
                            <tr data-event="${event.name}">
                                <td>${event.name}</td>
                                <td>${event.subject}</td>
                                <td>${event.description || ''}</td>
                                <td>${frappe.datetime.str_to_user(event.starts_on)}</td>
                                <td>${event.status}</td>
                            </tr>
                        `);
                    });

                    $('#events-table-body tr').click(function() {
                        const eventName = $(this).data('event');
                        frappe.set_route('event', eventName);
                    });

                    $('#events-search').on('input', function() {
                        const search = $(this).val().toLowerCase();
                        $('#events-table-body tr').each(function() {
                            const id = $(this).find('td:nth-child(1)').text().toLowerCase();
                            const subject = $(this).find('td:nth-child(2)').text().toLowerCase();
                            $(this).toggle(id.includes(search) || subject.includes(search));
                        });
                    });

                    $('#events-status-filter').change(function() {
                        filterTableByStatus('events', $(this).val());
                    });
                }
            }
        });

        setupFilterHandlers('events', filterType, dateRange);
        setupRowHandlers();
    }

    function renderTasks(filterType, dateRange) {
        $('#adi-crm-content').html(`
            <div class="adi-crm-top-bar">
                <h1 class="text-2xl font-semibold text-gray-800">Tasks</h1>
            </div>
            <div class="adi-crm-filters" id="tasks-filters">
                <button data-filter="today">Today</button>
                <button data-filter="yesterday">Yesterday</button>
                <button data-filter="weekly">Weekly</button>
                <button data-filter="monthly">Monthly</button>
                <button data-filter="date-range">Date Range</button>
                <span class="adi-crm-date-range" id="date-range-picker"></span>
                <input type="text" class="adi-crm-search" id="tasks-search" placeholder="Search by Description">
            </div>
            <table class="adi-crm-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Due Date</th>
                        <th><select class="adi-crm-status-filter" id="tasks-status-filter"><option value="All">All Status</option></select></th>
                        <th>Reference Type</th>
                    </tr>
                </thead>
                <tbody id="tasks-table-body"></tbody>
            </table>
        `);

        $(`#tasks-filters button[data-filter="${filterType}"]`).addClass('adi-crm-active');
        if (dateRange) {
            $(`#tasks-filters #date-range-picker`).html(`
                <input type="date" id="start-date" value="${dateRange.start}" />
                <input type="date" id="end-date" value="${dateRange.end}" />
                <button id="fetch-date-range">Fetch</button>
            `);
        }

        frappe.call({
            method: 'autowings_app.custom_scripts.api.get_tasks',
            args: { user: current_user, filter_type: filterType, date_range: dateRange },
            callback: function(r) {
                if (r.message) {
                    const statusSet = new Set(r.message.map(task => task.status));
                    statusSet.forEach(status => {
                        $('#tasks-status-filter').append(`<option value="${status}">${status}</option>`);
                    });

                    r.message.forEach(task => {
                        $('#tasks-table-body').append(`
                            <tr data-task="${task.name}">
                                <td>${task.description}</td>
                                <td>${frappe.datetime.str_to_user(task.date)}</td>
                                <td>${task.status}</td>
                                <td>${task.reference_type}</td>
                            </tr>
                        `);
                    });

                    $('#tasks-table-body tr').click(function() {
                        const taskName = $(this).data('task');
                        frappe.set_route('todo', taskName);
                    });

                    $('#tasks-search').on('input', function() {
                        const search = $(this).val().toLowerCase();
                        $('#tasks-table-body tr').each(function() {
                            const desc = $(this).find('td:nth-child(1)').text().toLowerCase();
                            $(this).toggle(desc.includes(search));
                        });
                    });

                    $('#tasks-status-filter').change(function() {
                        filterTableByStatus('tasks', $(this).val());
                    });
                }
            }
        });

        setupFilterHandlers('tasks', filterType, dateRange);
        setupRowHandlers();
    }

    function setupFilterHandlers(view, currentFilter, dateRange) {
        $('#adi-crm-content').off('click', '.adi-crm-filters button').on('click', '.adi-crm-filters button', function() {
            const $this = $(this);
            const filterType = $this.data('filter');

            $(`#${view}-filters button`).removeClass('adi-crm-active');
            $this.addClass('adi-crm-active');

            if (filterType === 'date-range') {
                $(`#${view}-filters #date-range-picker`).html(`
                    <input type="date" id="start-date" value="${dateRange ? dateRange.start : ''}" />
                    <input type="date" id="end-date" value="${dateRange ? dateRange.end : ''}" />
                    <button id="fetch-date-range">Fetch</button>
                `);

                $(`#${view}-filters #fetch-date-range`).click(function() {
                    const startDate = $(`#${view}-filters #start-date`).val();
                    const endDate = $(`#${view}-filters #end-date`).val();
                    if (startDate && endDate) {
                        const newDateRange = { start: startDate, end: endDate };
                        if (view === 'dashboard') renderDashboard(filterType, newDateRange);
                        else if (view === 'leads') renderLeads(filterType, newDateRange);
                        else if (view === 'opportunities') renderOpportunities(filterType, newDateRange);
                        else if (view === 'events') renderEvents(filterType, newDateRange);
                        else if (view === 'tasks') renderTasks(filterType, newDateRange);
                    } else {
                        frappe.msgprint('Please select both start and end dates.');
                    }
                });
            } else {
                $(`#${view}-filters #date-range-picker`).empty();
                if (view === 'dashboard') renderDashboard(filterType);
                else if (view === 'leads') renderLeads(filterType);
                else if (view === 'opportunities') renderOpportunities(filterType);
                else if (view === 'events') renderEvents(filterType);
                else if (view === 'tasks') renderTasks(filterType);
            }
        });
    }

    $('.adi-crm-sidebar li').click(function() {
        $('.adi-crm-sidebar li').removeClass('adi-crm-active');
        $(this).addClass('adi-crm-active');
        const view = $(this).data('view');
        if (view === 'dashboard') renderDashboard('monthly');
        else if (view === 'leads') renderLeads('monthly');
        else if (view === 'opportunities') renderOpportunities('monthly');
        else if (view === 'events') renderEvents('monthly');
        else if (view === 'tasks') renderTasks('monthly');

        if ($(window).width() <= 768) {
            $('#adi-crm-sidebar').removeClass('adi-crm-sidebar-visible').addClass('adi-crm-sidebar-collapsed');
            $('#adi-crm-main').addClass('adi-crm-main-full');
            $('#hamburger-menu').show();
        }
    });

    // Initial setup to ensure hamburger menu is visible on load if collapsed
    if ($(window).width() <= 768) {
        $('#adi-crm-sidebar').addClass('adi-crm-sidebar-collapsed');
        $('#adi-crm-main').addClass('adi-crm-main-full');
        $('#hamburger-menu').show();
    }

    renderDashboard('monthly');
};