"""Historical cutoff matching, NOT admission probabilities or eligibility validation."""
def match_colleges(dataset, *, exam_route, ranks, eligible_quotas_by_institute,
                   female_pool_eligible=False, program_contains=None):
    """Supply verified rank-list names and institute-specific quota eligibility.

    ranks: e.g. {'CRL': 5000, 'OBC-NCL': 1200}. Never derive category rank from CRL.
    eligible_quotas_by_institute: exact institute name -> set such as {'AI'} or {'OS'}.
    This function deliberately cannot guess home-state or special-quota eligibility.
    """
    for value in ranks.values():
        if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
            raise ValueError('Ranks must be positive integers')
    matches=[]
    for row in dataset['records']:
        if row['exam_route'] != exam_route: continue
        if row['quota'] not in eligible_quotas_by_institute.get(row['institute'], set()): continue
        if row['gender_pool'] != 'Gender-Neutral' and not female_pool_eligible: continue
        if row['opening_is_preparatory'] or row['closing_is_preparatory']: continue
        cutoff=row['closing_rank']; candidate_rank=ranks.get(row['rank_list'])
        if cutoff is None or candidate_rank is None: continue
        if program_contains and program_contains.casefold() not in row['program'].casefold(): continue
        # Better than the opening rank is NOT a reason to reject a college.
        if candidate_rank <= cutoff:
            matches.append({**row, 'candidate_rank_used':candidate_rank,
                            'historical_rank_margin':cutoff-candidate_rank,
                            'result_label':'within_historical_closing_rank',
                            'reference_year':dataset['metadata']['year'],
                            'reference_round':dataset['metadata']['round']})
    return matches
