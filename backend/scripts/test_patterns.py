from dotenv import load_dotenv
load_dotenv()

from backend.agents.patterns_analyst import run_patterns_analyst

state = {
    'topic': 'Taiwan strait tensions',
    'perspective_analysis': {
        'China': {
            'narrative_frame': 'Taiwan is a domestic sovereignty issue; US interference destabilizes the region',
            'structural_interests': 'Reunification is core to CPC legitimacy and territorial claims',
            'what_this_bloc_gains': 'Domestic nationalist support and international leverage',
            'deliberate_vs_organic': 'Highly deliberate state media coordination',
        },
        'Russia': {
            'narrative_frame': 'US provocations deliberately escalate unnecessary conflict',
            'structural_interests': 'Weakening US credibility globally strengthens Russian position',
            'what_this_bloc_gains': 'Distraction from Ukraine front, strategic China alignment',
            'deliberate_vs_organic': 'Deliberate amplification of Chinese framing',
        },
        'US/Western': {
            'narrative_frame': 'China threatens regional stability and democratic Taiwan',
            'structural_interests': 'Maintaining Indo-Pacific influence and alliance credibility',
            'what_this_bloc_gains': 'Justification for defense spending and forward alliances',
            'deliberate_vs_organic': 'Organic within shared Western liberal democratic framing',
        },
        'Europe': {
            'narrative_frame': 'Rules-based order must be maintained; avoid direct confrontation',
            'structural_interests': 'Economic ties with China, security ties with US — uncomfortable middle',
            'what_this_bloc_gains': 'Diplomatic positioning without committing military resources',
            'deliberate_vs_organic': 'Organic but increasingly coordinated EU position',
        },
    },
    'propaganda_techniques_per_region': {
        'China': {'Loaded_Language': 4, 'Appeal_to_Authority': 2, 'Flag_Waving': 1},
        'Russia': {'Loaded_Language': 5, 'Flag_Waving': 3, 'Whataboutism': 2},
        'US/Western': {'Appeal_to_Fear': 3, 'Loaded_Language': 2, 'Appeal_to_Values': 2},
        'Europe': {'Appeal_to_Authority': 2, 'Causal_Oversimplification': 1},
    },
    'bias_report': [],
    'final_report': '# Existing report\n\nSample content for smoke test.',
}

print("Running patterns analyst smoke test...")
result = run_patterns_analyst(state)

print("\n=== patterns_analysis ===")
import json
print(json.dumps(result['patterns_analysis'], indent=2))

print("\n=== Appended report section ===")
report = result['final_report']
patterns_start = report.find('## Cross-Bloc Pattern Analysis')
if patterns_start >= 0:
    print(report[patterns_start:])
else:
    print("[ERROR: patterns section not found in report]")

print("\n✓ Smoke test done")
