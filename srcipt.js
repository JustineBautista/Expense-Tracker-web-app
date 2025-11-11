
        // Data
        let expenses = [];
        let filteredExpenses = [];
        let currentMonth = new Date();
        let monthlyBudget = 0;
        let selectedRow = null;

        // Initialize
        window.onload = function() {
            loadData();
            updateMonthLabel();
            filterByMonth();
        };

        // Month Navigation
        function updateMonthLabel() {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
            document.getElementById('monthLabel').textContent = 
                `${months[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
        }

        function changeMonth(delta) {
            currentMonth.setMonth(currentMonth.getMonth() + delta);
            updateMonthLabel();
            filterByMonth();
        }

        function goToToday() {
            currentMonth = new Date();
            updateMonthLabel();
            filterByMonth();
        }

        // Add Expense
        function addExpense(event) {
            event.preventDefault();
            
            const amount = parseFloat(document.getElementById('amountInput').value);
            const category = document.getElementById('categoryInput').value;
            const description = document.getElementById('descriptionInput').value;

            const expense = {
                id: Date.now(),
                date: new Date(),
                amount: amount,
                category: category,
                description: description
            };

            expenses.unshift(expense);
            
            if (isInCurrentMonth(expense)) {
                filteredExpenses.unshift(expense);
            }

            saveData();
            filterByMonth();
            
            // Clear form
            document.getElementById('amountInput').value = '';
            document.getElementById('descriptionInput').value = '';
            document.getElementById('categoryInput').selectedIndex = 0;
            
            // Success animation
            const input = document.getElementById('amountInput');
            input.classList.add('success-animation');
            setTimeout(() => input.classList.remove('success-animation'), 500);
        }

        // Filter Expenses
        function isInCurrentMonth(expense) {
            const expDate = new Date(expense.date);
            return expDate.getMonth() === currentMonth.getMonth() && 
                   expDate.getFullYear() === currentMonth.getFullYear();
        }

        function filterByMonth() {
            filteredExpenses = expenses.filter(exp => isInCurrentMonth(exp));
            filterExpenses();
        }

        function filterExpenses() {
            const searchText = document.getElementById('searchInput').value.toLowerCase();
            const categoryFilter = document.getElementById('categoryFilter').value;
            
            const filtered = filteredExpenses.filter(exp => {
                const matchesSearch = exp.description.toLowerCase().includes(searchText) ||
                                    exp.category.toLowerCase().includes(searchText);
                const matchesCategory = categoryFilter === 'All Categories' || 
                                       exp.category === categoryFilter;
                return matchesSearch && matchesCategory;
            });

            renderTable(filtered);
            updateSummary();
        }

        // Render Table
        function renderTable(expensesToShow) {
            const tbody = document.getElementById('expenseTableBody');
            
            if (expensesToShow.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="empty-state">
                            <div class="empty-state-icon">📝</div>
                            <div>No expenses found</div>
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = expensesToShow.map((exp, index) => `
                <tr onclick="selectRow(${exp.id})" id="row-${exp.id}">
                    <td>${formatDate(exp.date)}</td>
                    <td>${exp.category}</td>
                    <td>${exp.description}</td>
                    <td class="amount-cell">$${exp.amount.toFixed(2)}</td>
                </tr>
            `).join('');
        }

        function selectRow(id) {
            // Remove previous selection
            const rows = document.querySelectorAll('.expense-table tbody tr');
            rows.forEach(row => row.classList.remove('selected'));
            
            // Add selection to clicked row
            const row = document.getElementById(`row-${id}`);
            if (row) {
                row.classList.add('selected');
                selectedRow = id;
            }
        }

        // Edit Expense
        function editExpense() {
            if (!selectedRow) {
                alert('Please select an expense to edit');
                return;
            }

            const expense = expenses.find(e => e.id === selectedRow);
            if (!expense) return;

            const amount = prompt('Enter new amount:', expense.amount);
            if (amount === null) return;

            const newAmount = parseFloat(amount);
            if (isNaN(newAmount) || newAmount <= 0) {
                alert('Please enter a valid amount');
                return;
            }

            const description = prompt('Enter new description:', expense.description);
            if (description === null) return;

            expense.amount = newAmount;
            expense.description = description;

            saveData();
            filterByMonth();
        }

        // Delete Expense
        function deleteExpense() {
            if (!selectedRow) {
                alert('Please select an expense to delete');
                return;
            }

            if (confirm('Delete this expense?')) {
                expenses = expenses.filter(e => e.id !== selectedRow);
                selectedRow = null;
                saveData();
                filterByMonth();
            }
        }

        // Clear All
        function clearAllExpenses() {
            if (expenses.length === 0) return;
            
            if (confirm(`Delete all ${expenses.length} expenses? This cannot be undone.`)) {
                expenses = [];
                filteredExpenses = [];
                selectedRow = null;
                saveData();
                filterByMonth();
            }
        }

        // Budget
        function setBudget() {
            const budget = prompt('Enter monthly budget:', monthlyBudget || '');
            if (budget === null) return;

            const newBudget = parseFloat(budget);
            if (isNaN(newBudget) || newBudget < 0) {
                alert('Please enter a valid budget amount');
                return;
            }

            monthlyBudget = newBudget;
            saveData();
            updateSummary();
        }

        // Update Summary
        function updateSummary() {
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());

            // Calculate totals
            const todayTotal = filteredExpenses
                .filter(e => new Date(e.date).toDateString() === today.toDateString())
                .reduce((sum, e) => sum + e.amount, 0);

            const weekTotal = filteredExpenses
                .filter(e => new Date(e.date) >= startOfWeek)
                .reduce((sum, e) => sum + e.amount, 0);

            const monthTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

            // Update UI
            document.getElementById('todayTotal').textContent = `$${todayTotal.toFixed(2)}`;
            document.getElementById('weekTotal').textContent = `$${weekTotal.toFixed(2)}`;
            document.getElementById('monthTotal').textContent = `$${monthTotal.toFixed(2)}`;

            // Update budget
            if (monthlyBudget > 0) {
                const percentUsed = (monthTotal / monthlyBudget) * 100;
                const remaining = monthlyBudget - monthTotal;
                
                const progressFill = document.getElementById('budgetProgress');
                progressFill.style.width = Math.min(percentUsed, 100) + '%';
                progressFill.textContent = `${percentUsed.toFixed(0)}% used`;

                if (percentUsed >= 90) {
                    progressFill.classList.add('danger');
                    progressFill.classList.remove('warning');
                } else if (percentUsed >= 75) {
                    progressFill.classList.add('warning');
                    progressFill.classList.remove('danger');
                } else {
                    progressFill.classList.remove('warning', 'danger');
                }

                if (remaining >= 0) {
                    document.getElementById('budgetStatus').textContent = 
                        `$${remaining.toFixed(2)} of $${monthlyBudget.toFixed(2)} remaining`;
                } else {
                    document.getElementById('budgetStatus').textContent = `$${Math.abs(remaining).toFixed(2)} over budget`;
                }
            } else {
                document.getElementById('budgetProgress').style.width = '0%';
                document.getElementById('budgetProgress').textContent = '0%';
                document.getElementById('budgetStatus').textContent = 'No budget set';
            }
        }

        // Data Persistence
        function loadData() {
            const savedExpenses = localStorage.getItem('expenses');
            const savedBudget = localStorage.getItem('monthlyBudget');
            
            if (savedExpenses) {
                expenses = JSON.parse(savedExpenses).map(exp => ({
                    ...exp,
                    date: new Date(exp.date)
                }));
            }
            
            if (savedBudget) {
                monthlyBudget = parseFloat(savedBudget);
            }
        }

        function saveData() {
            localStorage.setItem('expenses', JSON.stringify(expenses));
            localStorage.setItem('monthlyBudget', monthlyBudget.toString());
        }

        // Format Date
        function formatDate(date) {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
        }

        // Analytics
        function showAnalytics() {
            const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const avgExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
            const maxExpense = expenses.length > 0 ? Math.max(...expenses.map(exp => exp.amount)) : 0;
            
            const categoryTotals = {};
            expenses.forEach(exp => {
                const category = exp.category;
                categoryTotals[category] = (categoryTotals[category] || 0) + exp.amount;
            });
            
            const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
                categoryTotals[a] > categoryTotals[b] ? a : b, '');
            
            const content = `
                <div class="analytics-summary">
                    <div class="analytics-row">
                        <span>Total Expenses:</span>
                        <span>$${totalExpenses.toFixed(2)}</span>
                    </div>
                    <div class="analytics-row">
                        <span>Number of Expenses:</span>
                        <span>${expenses.length}</span>
                    </div>
                    <div class="analytics-row">
                        <span>Average Expense:</span>
                        <span>$${avgExpense.toFixed(2)}</span>
                    </div>
                    <div class="analytics-row">
                        <span>Largest Expense:</span>
                        <span>$${maxExpense.toFixed(2)}</span>
                    </div>
                    <div class="analytics-row">
                        <span>Top Category:</span>
                        <span>${topCategory || 'None'}</span>
                    </div>
                </div>
            `;
            
            document.getElementById('analyticsContent').innerHTML = content;
            document.getElementById('analyticsModal').classList.add('active');
        }

        // Category Report
        function showCategoryReport() {
            const categoryTotals = {};
            expenses.forEach(exp => {
                const category = exp.category;
                categoryTotals[category] = (categoryTotals[category] || 0) + exp.amount;
            });
            
            const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
            
            const sortedCategories = Object.keys(categoryTotals).sort((a, b) => 
                categoryTotals[b] - categoryTotals[a]);
            
            const content = sortedCategories.map(category => {
                const amount = categoryTotals[category];
                const percentage = total > 0 ? (amount / total * 100).toFixed(1) : 0;
                
                return `
                    <div class="category-bar">
                        <div class="category-bar-header">
                            <span>${category}</span>
                            <span>$${amount.toFixed(2)} (${percentage}%)</span>
                        </div>
                        <div class="category-bar-progress">
                            <div class="category-bar-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
            
            document.getElementById('categoryReportContent').innerHTML = content || '<div class="empty-state">No expenses to analyze</div>';
            document.getElementById('categoryReportModal').classList.add('active');
        }

        // Export to CSV
        function exportToCSV() {
            if (expenses.length === 0) {
                alert('No expenses to export');
                return;
            }
            
            const csvContent = [
                ['Date', 'Category', 'Description', 'Amount'],
                ...expenses.map(exp => [
                    formatDate(exp.date),
                    exp.category,
                    exp.description,
                    exp.amount.toFixed(2)
                ])
            ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'expenses.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Modal Management
        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }
