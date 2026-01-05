"""
Analýza rozdílů mezi výsledky webu a Python GUI
Kalkulace ID: a639f6b9-ad51-4f1e-bea5-25b9056d811d
"""

# Výsledky z WEBU
web_results = {
    "period": "Neznámé období",
    "costs": {
        "Pouze spotřeba": 5816.982,
        "Spotřeba a FVE": 4199.299,
        "Spotřeba a baterie": 4783.667,
        "Spotřeba, FVE, bat": 3152.983
    },
    "energy_balance": {
        "Pouze spotřeba": {"odber": 815.530, "dodavka": 0.000, "celkem": 815.530},
        "Pouze FVE": {"odber": 0.000, "dodavka": -236.951, "celkem": -236.951},
        "Pouze baterie": {"odber": 438.801, "dodavka": -421.425, "celkem": 17.377},
        "Spotřeba a FVE": {"odber": 605.060, "dodavka": -26.480, "celkem": 578.579},
        "Spotřeba a baterie": {"odber": 924.950, "dodavka": -92.043, "celkem": 832.907},
        "Spotřeba, FVE, bat": {"odber": 705.812, "dodavka": -109.856, "celkem": 595.956}
    }
}

# Výsledky z PYTHON GUI (177 dní, 31-12-2023 až 25-06-2024)
python_results_177 = {
    "period": "177 dní (31-12-2023 až 25-06-2024)",
    "costs": {
        "Pouze spotřeba": 18816.614,
        "Spotřeba a FVE": 16606.422,
        "Spotřeba a baterie": 18686.341,
        "Spotřeba, FVE, bat": 16471.247
    },
    "battery_cycles": 53.52
}

# Výsledky z PYTHON GUI (statisticky za rok)
python_results_year = {
    "period": "Celý rok (statisticky)",
    "costs": {
        "Pouze spotřeba": 38693.320,
        "Spotřeba a FVE": 34148.417,
        "Spotřeba a baterie": 38425.434,
        "Spotřeba, FVE, bat": 33870.451
    },
    "energy_balance": {
        "Pouze spotřeba": {"odber": 3295.448, "dodavka": 0.000, "celkem": 3295.448},
        "Pouze FVE": {"odber": 0.000, "dodavka": -408.228, "celkem": -408.228},
        "Pouze baterie": {"odber": 236.390, "dodavka": -203.861, "celkem": 32.527},
        "Spotřeba a FVE": {"odber": 2887.892, "dodavka": -0.672, "celkem": 2887.220},
        "Spotřeba a baterie": {"odber": 3327.975, "dodavka": 0.000, "celkem": 3327.975},
        "Spotřeba, FVE, bat": {"odber": 2919.747, "dodavka": 0.000, "celkem": 2919.747}
    },
    "battery_cycles": 110.06
}

print("=" * 80)
print("ANALÝZA ROZDÍLŮ MEZI WEBEM A PYTHON GUI")
print("=" * 80)
print()

# Porovnání nákladů - WEB vs PYTHON (177 dní)
print("1. POROVNÁNÍ NÁKLADŮ - Web vs Python (177 dní)")
print("-" * 80)
print(f"{'Scénář':<25} {'Web (tis. Kč)':<15} {'Python 177d':<15} {'Poměr Web/Py':>12}")
print("-" * 80)
for scenario in web_results["costs"].keys():
    web_cost = web_results["costs"][scenario]
    py_cost = python_results_177["costs"][scenario]
    ratio = web_cost / py_cost if py_cost > 0 else 0
    print(f"{scenario:<25} {web_cost:>12.3f}   {py_cost:>12.3f}   {ratio:>11.4f}x")

print()
print(f"Průměrný poměr: {sum(web_results['costs'][s] / python_results_177['costs'][s] for s in web_results['costs'].keys()) / len(web_results['costs']):.4f}x")
print()

# Porovnání nákladů - WEB vs PYTHON (statisticky za rok)
print("2. POROVNÁNÍ NÁKLADŮ - Web vs Python (statisticky za rok)")
print("-" * 80)
print(f"{'Scénář':<25} {'Web (tis. Kč)':<15} {'Python rok':<15} {'Poměr Web/Py':>12}")
print("-" * 80)
for scenario in web_results["costs"].keys():
    web_cost = web_results["costs"][scenario]
    py_cost = python_results_year["costs"][scenario]
    ratio = web_cost / py_cost if py_cost > 0 else 0
    print(f"{scenario:<25} {web_cost:>12.3f}   {py_cost:>12.3f}   {ratio:>11.4f}x")

print()
avg_ratio = sum(web_results['costs'][s] / python_results_year['costs'][s] for s in web_results['costs'].keys()) / len(web_results['costs'])
print(f"Průměrný poměr: {avg_ratio:.4f}x")
print()

# Odhad počtu dní, které web pokrývá
estimated_days = avg_ratio * 365
print(f"Odhad počtu dní na webu: {estimated_days:.1f} dní")
print()

# Porovnání energie - WEB vs PYTHON (statisticky za rok)
print("3. POROVNÁNÍ BILANCE ENERGIE - Web vs Python (statisticky za rok)")
print("-" * 80)
print(f"{'Scénář':<25} {'Web odběr':<12} {'Py odběr':<12} {'Web dodávka':<12} {'Py dodávka':<12}")
print("-" * 80)
for scenario in ["Pouze spotřeba", "Pouze FVE", "Pouze baterie", "Spotřeba a FVE", "Spotřeba a baterie", "Spotřeba, FVE, bat"]:
    if scenario in web_results["energy_balance"]:
        web_e = web_results["energy_balance"][scenario]
        if scenario in python_results_year["energy_balance"]:
            py_e = python_results_year["energy_balance"][scenario]
            web_ratio_odber = web_e["odber"] / py_e["odber"] if py_e["odber"] != 0 else 0
            web_ratio_dodavka = abs(web_e["dodavka"]) / abs(py_e["dodavka"]) if py_e["dodavka"] != 0 else 0
            print(f"{scenario:<25} {web_e['odber']:>10.1f} ({web_ratio_odber:.2f}x)  {py_e['odber']:>10.1f}  {web_e['dodavka']:>10.1f} ({web_ratio_dodavka:.2f}x)  {py_e['dodavka']:>10.1f}")

print()
print("=" * 80)
print("ZÁVĚRY:")
print("=" * 80)
print()
print(f"1. Web výsledky odpovídají ~{estimated_days:.0f} dnům (poměr {avg_ratio:.4f}x)")
print(f"2. Python GUI používá data za 177 dní (31-12-2023 až 25-06-2024)")
print(f"3. Web pravděpodobně používá JINÉ období nebo JINÁ DATA")
print()
print("MOŽNÉ PŘÍČINY ROZDÍLU:")
print("- Web používá jiné vstupní soubory")
print("- Web používá jiné časové období")
print("- Web má jiné parametry (ceny, baterie, FVE)")
print("- Web má chybu v načítání nebo zpracování dat")
print()
print("DOPORUČENÍ:")
print("1. Zkontrolovat, jaký soubor byl použit pro web kalkulaci")
print("2. Zkontrolovat časové období v datech na webu")
print("3. Porovnat parametry kalkulace (ceny, baterie, FVE)")
print("4. Spustit Python GUI se STEJNÝMI parametry a STEJNÝM souborem")
print()
